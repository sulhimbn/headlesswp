export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-800 text-white mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="focus:outline-none">
            &copy; {currentYear} Mitra Banten News. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
