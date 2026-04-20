'use client';

import { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { createCampaign } from '@/app/actions/campaigns';
import { useRouter } from 'next/navigation';

interface TemplateParam {
  index: number;
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
      // Find all {{N}} placeholders
      const matches = comp.text.match(/\{\{(\d+)\}\}/g);
      if (matches) {
        for (const m of matches) {
          const idx = parseInt(m.replace(/[{}]/g, ''));
          // Try to get example text if available
          const example = comp.example?.body_text?.[0]?.[idx - 1];
          bodyParams.push({ index: idx, example });
        }
      }
    }
  }

  return { headerType, bodyParams };
}

export function CreateCampaignModal({ 
  templates, 
  contacts 
}: { 
  templates: any[], 
  contacts: any[] 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [headerMediaUrl, setHeaderMediaUrl] = useState('');
  const [bodyParamValues, setBodyParamValues] = useState<string[]>([]);
  const router = useRouter();

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
    const selectedContactIds = formData.getAll('contactIds') as string[];

    if (selectedContactIds.length === 0) {
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
      await createCampaign(
        formData.get('name') as string,
        selectedTemplateId,
        selectedContactIds,
        Object.keys(templateVariables).length > 0 ? templateVariables : undefined
      );
      setIsOpen(false);
      setSelectedTemplateId('');
      setHeaderMediaUrl('');
      setBodyParamValues([]);
      router.refresh();
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
    bodyParamValues.forEach((val, i) => {
      text = text.replace(`{{${i + 1}}}`, val || `{{${i + 1}}}`);
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
                          Body Variable {`{{${param.index}}}`} {param.example && <span className="text-gray-400 ml-1">e.g., {param.example}</span>}
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
                          placeholder={param.example || `Value for {{${param.index}}}`}
                          className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-amber-400 outline-none"
                        />
                      </div>
                    ))}

                    {/* Live Preview */}
                    {previewBody && (
                      <div className="mt-2 p-3 bg-white border rounded-md">
                        <p className="text-xs font-medium text-gray-700 mb-1">Preview:</p>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{previewBody}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Contact Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Contacts ({contacts.length} available)</label>
                  <div className="border rounded-md p-3 max-h-48 overflow-y-auto bg-gray-50 space-y-2">
                    {contacts.length === 0 ? (
                      <p className="text-sm text-gray-600 text-center py-2">No contacts available. Upload contacts first.</p>
                    ) : (
                      contacts.map(c => (
                        <label key={c.id} className="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded">
                          <input type="checkbox" name="contactIds" value={c.id} className="rounded text-teal-600 focus:ring-teal-500" />
                          <span className="text-sm text-gray-800">{c.name || 'Unknown'} ({c.phoneNumber})</span>
                        </label>
                      ))
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
