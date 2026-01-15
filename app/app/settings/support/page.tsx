export default function SupportPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Support</h1>

      <div className="max-w-2xl space-y-6">
        <div className="border rounded p-6">
          <h2 className="text-xl font-semibold mb-4">Donations</h2>
          <p className="text-gray-600 mb-4">
            If you find PaperQSL Manager useful, please consider supporting its
            development:
          </p>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Venmo</h3>
              <p className="text-sm text-gray-600 mb-2">
                Send a donation via Venmo:
              </p>
              <div className="p-3 bg-gray-50 rounded">
                <p className="font-mono text-sm">@YourVenmoHandle</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Stripe</h3>
              <p className="text-sm text-gray-600 mb-2">
                Make a one-time or recurring donation:
              </p>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-500">
                  Stripe payment link placeholder - configure in Stripe dashboard
                </p>
                <a
                  href="#"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Donate via Stripe →
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded p-6">
          <h2 className="text-xl font-semibold mb-4">Contact & Support</h2>
          <p className="text-gray-600">
            For bug reports, feature requests, or questions, please open an
            issue on GitHub or contact the developer.
          </p>
        </div>
      </div>
    </div>
  )
}
