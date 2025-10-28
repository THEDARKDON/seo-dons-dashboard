'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Volume2, Download, SkipBack, SkipForward, Loader2 } from 'lucide-react';

interface CallRecordingPlayerProps {
  callSid?: string;
  recordingSid?: string;
  durationSeconds: number;
  callDetails?: {
    customerName?: string;
    date: string;
  };
}

export function CallRecordingPlayer({
  callSid,
  recordingSid,
  durationSeconds,
  callDetails
}: CallRecordingPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use proxy URL for secure access - prefer recording_sid over call_sid
  const sid = recordingSid || callSid;
  const proxyUrl = `/api/recordings/${sid}`;

  useEffect(() => {
    // Preload audio
    if (audioRef.current) {
      audioRef.current.addEventListener('canplay', () => {
        setIsLoading(false);
      });
      audioRef.current.addEventListener('error', () => {
        setError('Failed to load recording');
        setIsLoading(false);
      });
    }
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const skip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(durationSeconds, audioRef.current.currentTime + seconds));
    }
  };

  const downloadRecording = () => {
    const link = document.createElement('a');
    link.href = proxyUrl;
    link.download = `call-${callDetails?.date || callSid}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Call Recording</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Call Recording</span>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={downloadRecording}
            disabled={isLoading}
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Audio element */}
        <audio
          ref={audioRef}
          src={proxyUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          preload="metadata"
        />

        {/* Waveform visualization placeholder */}
        <div className="h-20 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 rounded-lg flex items-center justify-center relative overflow-hidden">
          {isLoading ? (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading recording...</span>
            </div>
          ) : (
            <>
              {/* Simple waveform bars */}
              <div className="flex items-center gap-1 h-full px-4">
                {Array.from({ length: 50 }).map((_, i) => {
                  const height = Math.random() * 60 + 20;
                  const isActive = (currentTime / durationSeconds) * 50 > i;
                  return (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-all ${
                        isActive ? 'bg-blue-600' : 'bg-blue-300'
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <Slider
            value={[currentTime]}
            max={durationSeconds}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
            disabled={isLoading}
          />
          <div className="flex justify-between text-xs text-gray-600">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(durationSeconds)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => skip(-10)}
            disabled={isLoading}
            title="Rewind 10 seconds"
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            onClick={togglePlay}
            className="h-12 w-12"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => skip(10)}
            disabled={isLoading}
            title="Forward 10 seconds"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Additional controls */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-gray-600" />
            <Slider
              value={[volume * 100]}
              max={100}
              step={1}
              onValueChange={(v) => {
                const newVolume = v[0] / 100;
                setVolume(newVolume);
                if (audioRef.current) audioRef.current.volume = newVolume;
              }}
              className="w-24"
              disabled={isLoading}
            />
          </div>

          <select
            value={playbackRate}
            onChange={(e) => {
              const rate = parseFloat(e.target.value);
              setPlaybackRate(rate);
              if (audioRef.current) audioRef.current.playbackRate = rate;
            }}
            className="text-sm border rounded px-2 py-1 bg-white"
            disabled={isLoading}
          >
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1">1x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>
        </div>

        {/* Call details */}
        {callDetails && (
          <div className="pt-4 border-t text-sm text-gray-600">
            {callDetails.customerName && (
              <p><strong>Customer:</strong> {callDetails.customerName}</p>
            )}
            <p><strong>Date:</strong> {callDetails.date}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
