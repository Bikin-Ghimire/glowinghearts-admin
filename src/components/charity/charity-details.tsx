'use client'

export function CharityDetails({ charity }: { charity: any }) {
  return (
    <div className="mt-8">
      <dl className="grid grid-cols-1 sm:grid-cols-2">
        <div className="border-t border-gray-100 px-4 py-6 sm:col-span-2 sm:px-0">
          <dt className="text-lg/6 font-medium">About</dt>
          <dd className="mt-1 text-sm/6 text-gray-700 dark:text-gray-200 sm:mt-2">
            <article className="prose prose-sm max-w-none">
              <div dangerouslySetInnerHTML={{ __html: charity.Txt_CharityDesc }} />
            </article>
          </dd>
        </div>
        <div className="px-4 py-6 sm:col-span-2 sm:px-0">
          <dt className="text-lg/6 font-medium">Charity Personnel</dt>
        </div>
        <div className="border-t border-gray-100 px-4 py-6 sm:col-span-1 sm:px-0">
          <dt className="text-sm/6 font-medium">First Name</dt>
          <dd className="mt-1 text-sm/6 text-gray-700 dark:text-gray-200">{charity.VC_ContactFirstName || 'No name available.'}</dd>
        </div>
        <div className="border-t border-gray-100 px-4 py-6 sm:col-span-1 sm:px-0">
          <dt className="text-sm/6 font-medium">Last Name</dt>
          <dd className="mt-1 text-sm/6 text-gray-700 dark:text-gray-200">{charity.VC_ContactLastName || 'No last name available.'}</dd>
        </div>
        <div className="border-t border-gray-100 px-4 py-6 sm:col-span-1 sm:px-0">
          <dt className="text-sm/6 font-medium">Email address</dt>
          <dd className="mt-1 text-sm/6 text-gray-700 dark:text-gray-200">{charity.VC_ContactEmail || 'No email available.'}</dd>
        </div>
        <div className="border-t border-gray-100 px-4 py-6 sm:col-span-1 sm:px-0">
          <dt className="text-sm/6 font-medium">Phone Number</dt>
          <dd className="mt-1 text-sm/6 text-gray-700 dark:text-gray-200">{charity.VC_ContactPhone || 'No phone number available.'}</dd>
        </div>
      </dl>
    </div>
  )
}