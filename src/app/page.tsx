import ReceiptUploader from '@/components/ReceiptUploader';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation / Header */}
      <header className="w-full py-6 px-4 bg-white shadow-sm flex justify-center items-center">
        <h1 className="text-2xl font-bold text-blue-600 tracking-tight">
          Wild-and-R <span className="text-gray-400 font-light text-lg">| Split Bill</span>
        </h1>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center px-4 py-12">
        <div className="text-center max-w-2xl mb-12">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
            Stop the "How should we split the bill?" headache
          </h2>
          <p className="text-lg text-gray-600">
            Snap your receipt and share the bill in seconds.
          </p>
        </div>

        <div className="w-full max-w-lg">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            <div className="p-1">
              <ReceiptUploader />
            </div>
          </div>
        </div>

        {/* Simple 1-2-3 Guide */}
        <section className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center max-w-4xl">
          <div>
            <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">1</div>
            <h3 className="font-semibold text-gray-800">Upload</h3>
            <p className="text-sm text-gray-500">Photo your receipt from the restaurant.</p>
          </div>
          <div>
            <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">2</div>
            <h3 className="font-semibold text-gray-800">AI Extract</h3>
            <p className="text-sm text-gray-500">We auto-detect items and prices.</p>
          </div>
          <div>
            <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">3</div>
            <h3 className="font-semibold text-gray-800">Split & Share</h3>
            <p className="text-sm text-gray-500">Send split bills in WhatsApp to everyone.</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-400 text-sm border-t border-gray-100">
        &copy; 2026 Wild-and-R Project. Built for Fullstack Training.
      </footer>
    </div>
  );
}