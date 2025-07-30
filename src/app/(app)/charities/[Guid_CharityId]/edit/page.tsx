import CharityForm from '@/components/charity/charity-form'

type PageProps = {
  params: {
    Guid_CharityId: string
  }
}

export default function EditCharityPage({ params }: PageProps) {
  return <CharityForm Guid_CharityId={params.Guid_CharityId} />
}