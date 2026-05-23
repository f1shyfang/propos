import { VoiceAgent } from '@/components/voice/voice-agent';

export const metadata = {
  title: 'Voice Agent — PropertyGo',
  description: 'Talk to your PropertyGo assistant',
};

export default function VoicePage() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <VoiceAgent />
    </div>
  );
}
