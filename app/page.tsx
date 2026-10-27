import Link from "next/link";
import { Card, Button } from "@/components/ui";
export default function Landing() {
  return (
    <div className="space-y-4">
      <Card><h1 className="text-3xl font-bold">Know what was agreed. See the evidence. Track what is done.</h1>
      <p className="mt-2 text-slate-700">KaamProof is an evidence-first work verification platform for customers and service providers in India — starting with home repair and renovation. Agree the criteria, submit photos against each task, get an AI-assisted review, and let a human decide.</p>
      <div className="mt-4 flex gap-3"><Link href="/projects/new"><Button>Create a project</Button></Link><Link href="/dashboard" className="rounded-xl border px-4 py-2.5 text-sm font-semibold no-underline">View demo project</Link></div></Card>
      <Card><h2 className="font-semibold">How it works — 3 steps</h2><ol className="mt-2 list-decimal space-y-1 pl-5 text-sm"><li>Define the task and its completion criteria, so &ldquo;done&rdquo; means the same thing to both sides.</li><li>Submit before / during / after photos against that specific task.</li><li>Review the AI assessment, request more evidence if needed, and record a human decision.</li></ol></Card>
      <Card><h2 className="font-semibold">Example task review</h2><p className="mt-1 text-sm text-slate-700">Task: Paint the bedroom walls. The provider uploads two wall photos. The AI finds: <em>&ldquo;Additional evidence is needed. The current photographs do not show all the agreed inspection areas.&rdquo;</em> The provider adds the missing walls and corners, and the customer records a decision. Nothing is marked accepted by the AI alone.</p></Card>
      <Card><h2 className="font-semibold">What KaamProof does not claim</h2><ul className="mt-1 list-disc space-y-1 pl-5 text-sm"><li>AI findings are advisory, not certification of workmanship, safety, or legal compliance.</li><li>An upload timestamp proves when the app received a file, not when a photo was captured.</li><li>KaamProof does not prove a photograph is authentic, does not hold payments, and does not decide who is at fault in a dispute.</li></ul></Card>
    </div>
  );
}
