import { redirect } from 'next/navigation';

// Redirect to speakers list — individual speaker pages not yet implemented
export default function SpeakerDetailPage() {
  redirect('/evento/palestrantes');
}
