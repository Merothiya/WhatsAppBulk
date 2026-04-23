'use client';

import { useState, useMemo, useEffect } from 'react';
import { X } from 'lucide-react';
import { createCampaign } from '@/app/actions/campaigns';
import { getContacts, getContactsCount } from '@/app/actions/contacts';
import { useRouter } from 'next/navigation';

interface TemplateParam {
  index: number;
  name: string;
  example?: string;
}

function extractTemplateRequirements(template: any) {
  const components = template.components as any[];
  if (!components) return { headerType: null, bodyParams: [] };

  let headerType: string | null = null;
  const bodyParams: TemplateParam[] = [];

  for (const comp of components) {
    if (comp.type === 'HEADER') {
      if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(comp.format)) {
        headerType = comp.format;
      }
    }
    if (comp.type === 'BODY' && comp.text) {
      // Find all {{VAR_NAME}} placeholders (digits or words)
      const matches = comp.text.match(/\{\{(.+?)\}\}/g);
      if (matches) {
        matches.forEach((m: string, i: number) => {
          const varName = m.replace(/[{}]/g, '');
          // Keep track of the actual order for Meta API
          const example = comp.example?.body_text?.[0]?.[i];
          bodyParams.push({ 
            index: i + 1, 
            name: varName,
            example 
          });
        });
      }
    }
  }

  return { headerType, bodyParams };
}

export function CreateCampaignModal({ 
  templates 
}: { 
  templates: any[] 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [headerMediaUrl, setHeaderMediaUrl] = useState('');
  const [bodyParamValues, setBodyParamValues] = useState<string[]>([]);
  const [selectedContactIdsState, setSelectedContactIdsState] = useState<Set<string>>(new Set());
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalMatchingCount, setTotalMatchingCount] = useState(0);
  const router = useRouter();

  const PAGE_SIZE = 20;

  const loadMoreContacts = async (isInitial = false, overrideSearch?: string) => {
    if (loadingContacts || (!hasMore && !isInitial)) return;
    
    setLoadingContacts(true);
    const currentSkip = isInitial ? 0 : skip;
    const currentSearch = overrideSearch !== undefined ? overrideSearch : searchTerm;
    
    try {
      const list = await getContacts(PAGE_SIZE, currentSkip, currentSearch);
      if (isInitial) {
        setContacts(list);
        setSkip(PAGE_SIZE);
      } else {
        setContacts(prev => [...prev, ...list]);
        setSkip(prev => prev + PAGE_SIZE);
      }
      setHasMore(list.length === PAGE_SIZE);
    } catch (e) {
      console.error('Failed to load contacts', e);
    } finally {
      setLoadingContacts(false);
    }
  };

  useEffect(() => {
    if (isOpen && contacts.length === 0) {
      loadMoreContacts(true);
    }
  }, [isOpen]);

  // Handle Search Change
  useEffect(() => {
    if (isOpen) {
      const delayDebounceFn = setTimeout(() => {
        setSkip(0);
        setHasMore(true);
        loadMoreContacts(true, searchTerm);
        
        // Fetch total matching count
        getContactsCount(searchTerm).then(setTotalMatchingCount).catch(console.error);
      }, 300);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchTerm]);

  // Sync isSelectAll with newly loaded contacts
  useEffect(() => {
    if (isSelectAll && contacts.length > 0) {
      setSelectedContactIdsState(prev => {
        const next = new Set(prev);
        contacts.forEach(c => next.add(c.id));
        return next;
      });
    }
  }, [contacts, isSelectAll]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50) { // Near bottom
      loadMoreContacts();
    }
  };

  const selectedTemplate = useMemo(
    () => templates.find(t => t.id === selectedTemplateId),
    [selectedTemplateId, templates]
  );

  const requirements = useMemo(
    () => selectedTemplate ? extractTemplateRequirements(selectedTemplate) : { headerType: null, bodyParams: [] },
    [selectedTemplate]
  );

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setHeaderMediaUrl('');
    const tpl = templates.find(t => t.id === templateId);
    if (tpl) {
      const reqs = extractTemplateRequirements(tpl);
      setBodyParamValues(new Array(reqs.bodyParams.length).fill(''));
    } else {
      setBodyParamValues([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const selectedContactIds = Array.from(selectedContactIdsState);

    if (!isSelectAll && selectedContactIds.length === 0) {
      alert('Please select at least one contact.');
      setLoading(false);
      return;
    }

    // Build template variables
    const templateVariables: any = {};
    if (requirements.headerType && headerMediaUrl) {
      templateVariables.headerMediaUrl = headerMediaUrl;
    }
    if (requirements.bodyParams.length > 0) {
      templateVariables.bodyParams = bodyParamValues;
    }

    try {
      const campaignId = await createCampaign(
        formData.get('name') as string,
        selectedTemplateId,
        isSelectAll ? [] : selectedContactIds, // Send empty array if selectAll is true
        Object.keys(templateVariables).length > 0 ? templateVariables : undefined,
        isSelectAll,
        searchTerm
      );
      setIsOpen(false);
      setSelectedTemplateId('');
      setHeaderMediaUrl('');
      setBodyParamValues([]);
      setSelectedContactIdsState(new Set());
      setIsSelectAll(false);
      setSearchTerm('');
      router.push(`/campaigns/${campaignId}`);
    } catch (error: any) {
      alert(`Failed to create campaign: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Preview template body text with filled variables
  const previewBody = useMemo(() => {
    if (!selectedTemplate) return null;
    const components = selectedTemplate.components as any[];
    const bodyComp = components?.find((c: any) => c.type === 'BODY');
    if (!bodyComp?.text) return null;
    let text = bodyComp.text as string;
    requirements.bodyParams.forEach((param, i) => {
      const val = bodyParamValues[i] ? bodyParamValues[i].trim() : `{{${param.name}}}`;
      text = text.replace(`{{${param.name}}}`, val);
    });
    return text;
  }, [selectedTemplate, bodyParamValues]);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition"
      >
        New Campaign
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">Create New Campaign</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-800">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 space-y-5">
                {/* Campaign Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
                  <input 
                    required 
                    name="name" 
                    type="text" 
                    placeholder="e.g., Summer Promo" 
                    className="w-full border rounded-md p-2 focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                {/* Template Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Template</label>
                  <select 
                    required 
                    value={selectedTemplateId}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    className="w-full border rounded-md p-2 focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                  >
                    <option value="">-- Choose an approved template --</option>
                    {templates.filter(t => t.status === 'APPROVED').map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.language})</option>
                    ))}
                  </select>
                </div>

                {/* Dynamic Template Parameters */}
                {selectedTemplate && (requirements.headerType || requirements.bodyParams.length > 0) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                    <h4 className="text-sm font-bold text-amber-800">Template Parameters Required</h4>

                    {requirements.headerType && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Header {requirements.headerType} URL
                        </label>
                        <input
                          required
                          type="url"
                          value={headerMediaUrl}
                          onChange={(e) => setHeaderMediaUrl(e.target.value)}
                          placeholder={`https://example.com/media.${requirements.headerType === 'IMAGE' ? 'jpg' : requirements.headerType === 'VIDEO' ? 'mp4' : 'pdf'}`}
                          className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-amber-400 outline-none"
                        />
                      </div>
                    )}

                    {requirements.bodyParams.map((param, i) => (
                      <div key={i}>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Variable: <span className="font-bold text-teal-700">{`{{${param.name}}}`}</span> {param.example && <span className="text-gray-400 ml-1">e.g., {param.example}</span>}
                        </label>
                        <input
                          required
                          type="text"
                          value={bodyParamValues[i] || ''}
                          onChange={(e) => {
                            const newVals = [...bodyParamValues];
                            newVals[i] = e.target.value;
                            setBodyParamValues(newVals);
                          }}
                          placeholder={param.example || `Value for ${param.name}`}
                          className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-amber-400 outline-none"
                        />
                      </div>
                    ))}

                    {/* Live Preview */}
                    {(previewBody || (requirements.headerType === 'IMAGE' && headerMediaUrl)) && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-700 mb-1">Preview:</p>
                        <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
                          {requirements.headerType === 'IMAGE' && headerMediaUrl && (
                            <div className="aspect-video bg-gray-100 flex items-center justify-center border-b overflow-hidden">
                              <img 
                                src={headerMediaUrl} 
                                alt="Header Media Preview" 
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          <div className="p-3">
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{previewBody}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Contact Selection */}
                <div className="space-y-3">
                  <div className="flex flex-col gap-2">
                    <label className="block text-sm font-medium text-gray-700">Select Contacts</label>
                    <input 
                      type="text" 
                      placeholder="Search by name..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>

                  <div className="flex justify-between items-center px-1">
                    <div className="flex flex-col">
                      <p className="text-[10px] text-teal-600 uppercase tracking-wider font-bold">
                        Selected: {isSelectAll ? totalMatchingCount : selectedContactIdsState.size}
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                        Loaded: {contacts.length} of {totalMatchingCount}
                      </p>
                    </div>
                    {!loadingContacts && contacts.length > 0 && (
                      <label className="flex items-center space-x-1.5 text-sm font-medium text-teal-600 hover:text-teal-700 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="rounded text-teal-600 focus:ring-teal-500"
                          checked={isSelectAll}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setIsSelectAll(checked);
                            if (checked) {
                              const batch = new Set(selectedContactIdsState);
                              contacts.forEach(c => batch.add(c.id));
                              setSelectedContactIdsState(batch);
                            } else {
                              setSelectedContactIdsState(new Set());
                            }
                          }}
                        />
                        <span>Select All</span>
                      </label>
                    )}
                  </div>
                  <div 
                    onScroll={handleScroll}
                    className="border rounded-md p-3 max-h-48 overflow-y-auto bg-gray-50 space-y-2"
                  >
                    {contacts.map(c => (
                      <label key={c.id} className="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded">
                        <input 
                          type="checkbox" 
                          name="contactIds" 
                          value={c.id} 
                          checked={selectedContactIdsState.has(c.id) || isSelectAll}
                          onChange={(e) => {
                            const next = new Set(selectedContactIdsState);
                            if (e.target.checked) {
                              next.add(c.id);
                            } else {
                              next.delete(c.id);
                              // If they manual deselect one, it's no longer a "Grand Select All"
                              setIsSelectAll(false);
                            }
                            setSelectedContactIdsState(next);
                          }}
                          className="rounded text-teal-600 focus:ring-teal-500" 
                        />
                        <span className="text-sm text-gray-800">{c.name || 'Unknown'} ({c.phoneNumber})</span>
                      </label>
                    ))}
                    
                    {loadingContacts && (
                      <div className="flex items-center justify-center py-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-600"></div>
                      </div>
                    )}

                    {!loadingContacts && contacts.length === 0 && (
                      <p className="text-sm text-gray-600 text-center py-2">No contacts available. Upload contacts first.</p>
                    )}
                    
                    {!hasMore && contacts.length > 0 && (
                      <p className="text-[10px] text-gray-400 text-center py-1">All contacts loaded</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100 transition"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
