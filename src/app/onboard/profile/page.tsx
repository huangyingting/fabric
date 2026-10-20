'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sparkles, User, Users, Check, ArrowRight, ArrowLeft } from 'lucide-react';

const USE_CASES = [
  'Organize projects',
  'Take notes',
  'Save links & articles',
  'AI research & synthesis',
  'Design moodboards',
  'Archive PDFs & documents',
  'Voice & meeting notes',
  'Second brain knowledge graph',
];

const PERSONALITIES = [
  { id: 'balanced', label: 'Balanced', desc: 'Thoughtful, structured, and clear' },
  { id: 'warm', label: 'Warm', desc: 'Friendly, encouraging, and collaborative' },
  { id: 'direct', label: 'Direct', desc: 'Leads with the answer, zero fluff' },
  { id: 'concise', label: 'Concise', desc: 'Crisp bullet points and short sentences' },
  { id: 'sassy', label: 'Sassy', desc: 'Witty and playfully sharp' },
];

const AVATAR_COLORS = ['#45BAF9', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#191918'];

const ATTRIBUTIONS = [
  'Search engine (Google / Bing)',
  'YouTube',
  'Friend or colleague',
  'X / Twitter',
  'LinkedIn',
  'AI newsletter or blog',
];

export default function OnboardProfilePage() {
  const router = useRouter();
  const { update } = useSession();
  const [step, setStep] = useState(1);
  const [workspaceType, setWorkspaceType] = useState<'personal' | 'team'>('personal');
  const [useCases, setUseCases] = useState<string[]>(['Organize projects', 'Take notes', 'AI research & synthesis']);
  const [assistantName, setAssistantName] = useState('Rue');
  const [assistantColor, setAssistantColor] = useState('#45BAF9');
  const [assistantPersonality, setAssistantPersonality] = useState('balanced');
  const [attribution, setAttribution] = useState('Search engine (Google / Bing)');
  const [planTier, setPlanTier] = useState<'free' | 'pro'>('free');
  const [submitting, setSubmitting] = useState(false);

  function toggleUseCase(uc: string) {
    setUseCases((prev) => (prev.includes(uc) ? prev.filter((i) => i !== uc) : [...prev, uc]));
  }

  async function handleFinish(selectedPlan: 'free' | 'pro') {
    setSubmitting(true);
    try {
      const res = await fetch('/api/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceType,
          useCases,
          assistantName,
          assistantColor,
          assistantPersonality,
          attribution,
          planTier: selectedPlan,
        }),
      });
      const data = await res.json();
      await update({
        hasFinishedOnboarding: true,
        defaultWorkspaceSlug: data.workspaceSlug,
      });
      router.push(data.redirectTo || `/${data.workspaceSlug}/get-started`);
      router.refresh();
    } catch {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F8F7] flex flex-col justify-between p-6">
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <div className="w-7 h-7 rounded-lg bg-[#191918] text-white flex items-center justify-center text-sm font-bold">
            F
          </div>
          <span>fabric</span>
        </div>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s <= step ? 'w-8 bg-[#191918]' : 'w-4 bg-[#E6E6E3]'
              }`}
            />
          ))}
        </div>
      </header>

      <main className="max-w-xl w-full mx-auto bg-white border border-[#E6E6E3] rounded-2xl shadow-sm p-8 my-8">
        {step === 1 && (
          <div data-testid="onboard-step-1" className="space-y-6">
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-[#6B6B68]">Step 1 of 5</span>
              <h1 className="text-2xl font-semibold mt-1">How will you use Fabric?</h1>
              <p className="text-sm text-[#6B6B68] mt-1">
                Choose your workspace setup. You can create additional spaces anytime.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                data-testid="onboard-personal-btn"
                type="button"
                onClick={() => setWorkspaceType('personal')}
                className={`p-5 rounded-2xl border text-left transition ${
                  workspaceType === 'personal'
                    ? 'border-[#191918] bg-[#F8F8F7] ring-2 ring-[#191918]/10'
                    : 'border-[#E6E6E3] hover:border-[#9B9B97]'
                }`}
              >
                <User className="w-6 h-6 mb-3 text-[#191918]" />
                <div className="font-semibold text-base">Personal workspace</div>
                <p className="text-xs text-[#6B6B68] mt-1">
                  For your own notes, research, bookmarks, files, and personal AI second brain.
                </p>
              </button>

              <button
                data-testid="onboard-team-btn"
                type="button"
                onClick={() => setWorkspaceType('team')}
                className={`p-5 rounded-2xl border text-left transition ${
                  workspaceType === 'team'
                    ? 'border-[#191918] bg-[#F8F8F7] ring-2 ring-[#191918]/10'
                    : 'border-[#E6E6E3] hover:border-[#9B9B97]'
                }`}
              >
                <Users className="w-6 h-6 mb-3 text-[#191918]" />
                <div className="font-semibold text-base">Team workspace</div>
                <p className="text-xs text-[#6B6B68] mt-1">
                  Collaborate across shared spaces, canvases, and annotated media with your team.
                </p>
              </button>
            </div>

            <button
              data-testid="onboard-next-1"
              type="button"
              onClick={() => setStep(2)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#191918] text-white text-sm font-medium flex items-center justify-center gap-2"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div data-testid="onboard-step-2" className="space-y-6">
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-[#6B6B68]">Step 2 of 5</span>
              <h1 className="text-2xl font-semibold mt-1">What would you like to do in Fabric?</h1>
              <p className="text-sm text-[#6B6B68] mt-1">Select all that apply so we can tailor your workspace.</p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {USE_CASES.map((uc) => {
                const active = useCases.includes(uc);
                return (
                  <button
                    key={uc}
                    type="button"
                    onClick={() => toggleUseCase(uc)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition ${
                      active
                        ? 'bg-[#191918] text-white border-[#191918]'
                        : 'bg-[#F8F8F7] text-[#191918] border-[#E6E6E3] hover:bg-[#F3F3F1]'
                    }`}
                  >
                    {active && <Check className="w-3.5 h-3.5" />}
                    <span>{uc}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl border border-[#E6E6E3] text-xs font-medium flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                data-testid="onboard-next-2"
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#191918] text-white text-sm font-medium flex items-center justify-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div data-testid="onboard-step-3" className="space-y-6">
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-[#6B6B68]">Step 3 of 5</span>
              <h1 className="text-2xl font-semibold mt-1">Meet your AI assistant</h1>
              <p className="text-sm text-[#6B6B68] mt-1">
                Customize your assistant&apos;s name, color, and communication personality.
              </p>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F8F8F7] border border-[#E6E6E3]">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-sm shrink-0"
                style={{ backgroundColor: assistantColor }}
              >
                ☺
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-[#6B6B68] mb-1">Assistant Name</label>
                <input
                  data-testid="onboard-assistant-name"
                  type="text"
                  value={assistantName}
                  onChange={(e) => setAssistantName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#E6E6E3] bg-white text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6B6B68] mb-2">Avatar Color</label>
              <div className="flex gap-2.5">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAssistantColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition ${
                      assistantColor === c ? 'border-[#191918] scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6B6B68] mb-2">Personality</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PERSONALITIES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setAssistantPersonality(p.id)}
                    className={`p-3 rounded-xl border text-left transition ${
                      assistantPersonality === p.id
                        ? 'border-[#191918] bg-[#F8F8F7]'
                        : 'border-[#E6E6E3] hover:bg-[#F8F8F7]'
                    }`}
                  >
                    <div className="text-xs font-semibold">{p.label}</div>
                    <div className="text-[11px] text-[#6B6B68]">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2.5 rounded-xl border border-[#E6E6E3] text-xs font-medium flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                data-testid="onboard-next-3"
                type="button"
                onClick={() => setStep(4)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#191918] text-white text-sm font-medium flex items-center justify-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div data-testid="onboard-step-4" className="space-y-6">
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-[#6B6B68]">Step 4 of 5</span>
              <h1 className="text-2xl font-semibold mt-1">How did you hear about Fabric?</h1>
              <p className="text-sm text-[#6B6B68] mt-1">Helps us understand our community.</p>
            </div>

            <div className="space-y-2">
              {ATTRIBUTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setAttribution(item)}
                  className={`w-full px-4 py-3 rounded-xl border text-left text-xs font-medium flex items-center justify-between transition ${
                    attribution === item
                      ? 'border-[#191918] bg-[#F8F8F7]'
                      : 'border-[#E6E6E3] hover:bg-[#F8F8F7]'
                  }`}
                >
                  <span>{item}</span>
                  {attribution === item && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>

            <div className="flex justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2.5 rounded-xl border border-[#E6E6E3] text-xs font-medium flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                data-testid="onboard-next-4"
                type="button"
                onClick={() => setStep(5)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#191918] text-white text-sm font-medium flex items-center justify-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div data-testid="onboard-step-5" className="space-y-6">
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-[#6B6B68]">Step 5 of 5</span>
              <h1 className="text-2xl font-semibold mt-1">Choose your Fabric plan</h1>
              <p className="text-sm text-[#6B6B68] mt-1">
                Start with Fabric Free or unlock unlimited AI credits with Fabric Pro.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setPlanTier('free')}
                className={`p-5 rounded-2xl border cursor-pointer ${
                  planTier === 'free' ? 'border-[#191918] bg-[#F8F8F7]' : 'border-[#E6E6E3]'
                }`}
              >
                <div className="text-sm font-semibold">Fabric Free</div>
                <div className="text-2xl font-bold mt-1">$0</div>
                <ul className="mt-3 space-y-1.5 text-xs text-[#6B6B68]">
                  <li>• 1 GB cloud storage</li>
                  <li>• 1,000 monthly AI credits</li>
                  <li>• Notes, Canvases, PDFs, Audio & Video</li>
                </ul>
              </div>

              <div
                onClick={() => setPlanTier('pro')}
                className={`p-5 rounded-2xl border cursor-pointer ${
                  planTier === 'pro' ? 'border-[#191918] bg-[#F8F8F7]' : 'border-[#E6E6E3]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Fabric Pro</span>
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-[#45BAF9]/20 text-[#0284C7] font-semibold">
                    Popular
                  </span>
                </div>
                <div className="text-2xl font-bold mt-1">$12 / mo</div>
                <ul className="mt-3 space-y-1.5 text-xs text-[#6B6B68]">
                  <li>• 100 GB storage</li>
                  <li>• 10,000 monthly AI credits</li>
                  <li>• Scheduled AI Agents & All Pro Models</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                data-testid="onboard-finish-btn"
                type="button"
                disabled={submitting}
                onClick={() => handleFinish(planTier)}
                className="w-full py-3 px-4 rounded-xl bg-[#191918] text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#2c2c2a]"
              >
                <Sparkles className="w-4 h-4 text-[#45BAF9]" />
                <span>{submitting ? 'Setting up workspace...' : 'Continue with free plan'}</span>
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="text-center text-xs text-[#9B9B97]">
        Customize your assistant and preferences anytime in Settings.
      </footer>
    </div>
  );
}
