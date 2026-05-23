'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Icon } from '@/components/shared/icon';

export function VoiceAgent() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [agentReply, setAgentReply] = useState('');
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supportsSpeech, setSupportsSpeech] = useState(true);

  const recognitionRef = useRef<any>(null);

  // Detect speech support
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupportsSpeech(false);
      setError('Your browser does not support speech recognition. You can still type your questions below.');
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!speechEnabled) return;
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.name.includes('Google') && v.name.includes('US English'))
      || voices.find(v => v.name.includes('Samantha'))
      || voices.find(v => v.lang === 'en-US');
    if (preferred) {
      utterance.voice = preferred;
    }

    window.speechSynthesis.speak(utterance);
  }, [speechEnabled]);

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const sendToAgent = useCallback(async (text: string) => {
    if (!text.trim()) return;

    setIsProcessing(true);
    setTranscript(text.trim());
    setAgentReply('');
    setError(null);

    try {
      const res = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim() }),
      });

      if (!res.ok) {
        throw new Error('Failed to get response');
      }

      const data = await res.json();
      const reply = data.reply || "I'm not sure how to answer that yet.";

      setAgentReply(reply);
      speak(reply);
    } catch (err) {
      setError('Could not reach the voice agent. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [speak]);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    stopSpeaking();
    setError(null);
    setTranscript('');
    setAgentReply('');

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-AU';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript(finalTranscript);
        sendToAgent(finalTranscript);
        setIsListening(false);
      } else if (interimTranscript) {
        setTranscript(interimTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone permissions or type your question.');
      } else if (event.error === 'no-speech') {
        setError('No speech detected. Try again or type your question.');
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [sendToAgent, stopSpeaking]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const statusText = isListening
    ? 'Listening...'
    : isProcessing
      ? 'Thinking...'
      : agentReply
        ? ''
        : 'Tap to speak';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        padding: 32,
        background: 'var(--pg-bg)',
        position: 'relative',
      }}
    >
      {/* Top-right controls */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          right: 24,
          display: 'flex',
          gap: 8,
        }}
      >
        <button
          onClick={() => {
            setSpeechEnabled(!speechEnabled);
            if (speechEnabled) stopSpeaking();
          }}
          className="pg-btn pg-btn-ghost pg-btn-icon"
          title={speechEnabled ? 'Mute voice' : 'Enable voice'}
        >
          <Icon name={speechEnabled ? 'volume' : 'volume-x'} size={16} />
        </button>
        <button
          onClick={stopSpeaking}
          className="pg-btn pg-btn-ghost pg-btn-icon"
          title="Stop speaking"
        >
          <Icon name="pause" size={16} />
        </button>
      </div>

      {/* Big mic button */}
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        disabled={isProcessing}
        style={{
          width: 140,
          height: 140,
          borderRadius: 999,
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'all 200ms ease',
          background: isListening
            ? 'var(--pg-red)'
            : isProcessing
              ? 'var(--pg-text)'
              : 'var(--pg-accent)',
          color: '#1A1814',
          boxShadow: isListening
            ? '0 0 0 0 rgba(185,28,28,0)'
            : '0 4px 24px rgba(229,177,0,0.35)',
          animation: isListening ? 'micPulse 1.5s ease-in-out infinite' : 'none',
        }}
      >
        <Icon
          name={isListening ? 'x' : 'mic'}
          size={48}
          strokeWidth={1.5}
          color={isListening ? '#FAFAF7' : '#1A1814'}
        />
      </button>

      {/* Status */}
      <div
        style={{
          marginTop: 28,
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--pg-text-dim)',
          minHeight: 20,
          textAlign: 'center',
        }}
      >
        {statusText}
      </div>

      {/* Transcript */}
      {(transcript || isListening) && (
        <div
          style={{
            marginTop: 16,
            maxWidth: 560,
            textAlign: 'center',
            fontSize: 18,
            lineHeight: 1.5,
            color: 'var(--pg-text)',
            fontFamily: 'var(--pg-font-display)',
            fontWeight: 500,
            letterSpacing: '-0.01em',
            opacity: isProcessing ? 0.6 : 1,
            transition: 'opacity 200ms',
          }}
        >
          {transcript}
          {isListening && !transcript && (
            <span style={{ color: 'var(--pg-text-faint)' }}>Listening...</span>
          )}
        </div>
      )}

      {/* Agent reply */}
      {agentReply && !isProcessing && (
        <div
          style={{
            marginTop: 24,
            maxWidth: 560,
            textAlign: 'center',
            fontSize: 15,
            lineHeight: 1.6,
            color: 'var(--pg-text-dim)',
          }}
        >
          {agentReply}
        </div>
      )}

      {/* Thinking dots */}
      {isProcessing && (
        <div
          style={{
            marginTop: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: 'var(--pg-text-faint)',
                animation: `voicePulse 1s ease-in-out ${i * 0.15}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            marginTop: 24,
            maxWidth: 480,
            padding: '12px 18px',
            borderRadius: 10,
            background: 'var(--pg-red-tint)',
            color: 'var(--pg-red)',
            fontSize: 12.5,
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          {error}
        </div>
      )}

      {/* Fallback text input for non-speech browsers */}
      {!supportsSpeech && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const input = (e.target as HTMLFormElement).elements.namedItem('fallback-input') as HTMLInputElement;
            if (input.value.trim()) {
              sendToAgent(input.value);
              input.value = '';
            }
          }}
          style={{
            marginTop: 32,
            display: 'flex',
            gap: 8,
            width: '100%',
            maxWidth: 400,
          }}
        >
          <input
            name="fallback-input"
            type="text"
            placeholder="Type your question..."
            className="pg-input"
            disabled={isProcessing}
            style={{ flex: 1 }}
          />
          <button type="submit" className="pg-btn pg-btn-primary" disabled={isProcessing}>
            <Icon name="send" size={14} />
          </button>
        </form>
      )}
    </div>
  );
}
