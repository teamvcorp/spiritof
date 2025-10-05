export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-green-600">✅ Debug Route Test Successful!</h1>
      <p className="mt-4 text-gray-600">
        If you can see this page, the admin debug routing is working correctly.
      </p>
      <p className="mt-2 text-sm text-gray-500">
        URL: /admin/debug/test
      </p>
    </div>
  );
}