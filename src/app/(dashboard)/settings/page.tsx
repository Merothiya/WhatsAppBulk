import { getMetaConfig } from '@/lib/meta';

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  const config = getMetaConfig();

  const isConfigured = config.appId && config.appSecret && config.wabaId && config.phoneNumberId && config.systemUserToken && config.verifyToken;

  return (
    <div className="p-8 max-w-4xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>

      <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold border-b pb-2 mb-4 text-gray-900">Meta API Connection</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-900 font-medium">Status</span>
            {isConfigured ? (
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">Connected</span>
            ) : (
              <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full">Missing Configuration</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 text-sm">
            <div>
              <p className="text-gray-900 font-semibold mb-1">WhatsApp Business Account ID</p>
              <p className="font-mono text-black">{config.wabaId || 'Not set'}</p>
            </div>
            <div>
              <p className="text-gray-900 font-semibold mb-1">Phone Number ID</p>
              <p className="font-mono text-black">{config.phoneNumberId || 'Not set'}</p>
            </div>
            <div>
              <p className="text-gray-900 font-semibold mb-1">App ID</p>
              <p className="font-mono text-black">{config.appId || 'Not set'}</p>
            </div>
            <div>
              <p className="text-gray-900 font-semibold mb-1">Verify Token</p>
              <p className="font-mono text-black text-xs truncate max-w-[200px]">{config.verifyToken || 'Not set'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-900">Webhook Setup Instructions</h3>
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-900">
          <li>Deploy this project to Vercel to obtain a public URL.</li>
          <li>Go to developers.facebook.com &gt; WhatsApp &gt; Configuration.</li>
          <li>Set Callback URL to: <code>https://YOUR_VERCEL_APP_URL/api/webhooks/whatsapp</code></li>
          <li>Set Verify Token to your <code>META_VERIFY_TOKEN</code> environment variable.</li>
          <li>Subscribe to the <strong>messages</strong> and <strong>message_template_status_update</strong> webhook fields.</li>
        </ul>
      </div>
    </div>
  );
}
