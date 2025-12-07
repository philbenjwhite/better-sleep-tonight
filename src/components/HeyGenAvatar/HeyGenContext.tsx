"use client";

import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
} from "react";
import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskMode,
  TaskType,
  StartAvatarRequest,
} from "@heygen/streaming-avatar";

export enum AvatarSessionState {
  INACTIVE = "inactive",
  CONNECTING = "connecting",
  CONNECTED = "connected",
}

interface HeyGenContextProps {
  sessionState: AvatarSessionState;
  stream: MediaStream | null;
  isAvatarTalking: boolean;
  error: string | null;
  initializeAvatar: () => Promise<void>;
  speak: (text: string) => Promise<void>;
  stopSession: () => Promise<void>;
}

const HeyGenContext = createContext<HeyGenContextProps>({
  sessionState: AvatarSessionState.INACTIVE,
  stream: null,
  isAvatarTalking: false,
  error: null,
  initializeAvatar: async () => {},
  speak: async () => {},
  stopSession: async () => {},
});

// Default avatar configuration (avatarName added at runtime)
const DEFAULT_AVATAR_CONFIG: Omit<StartAvatarRequest, "avatarName"> = {
  quality: AvatarQuality.Medium,
  language: "en",
};

interface HeyGenProviderProps {
  children: React.ReactNode;
  avatarName: string;
  /**
   * Dev mode skips API calls and simulates avatar behavior.
   * Useful for UI development without using HeyGen credits.
   */
  devMode?: boolean;
}

export const HeyGenProvider: React.FC<HeyGenProviderProps> = ({
  children,
  avatarName,
  devMode = false,
}) => {
  const avatarRef = useRef<StreamingAvatar | null>(null);
  const [sessionState, setSessionState] = useState<AvatarSessionState>(
    AvatarSessionState.INACTIVE
  );
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isAvatarTalking, setIsAvatarTalking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dev mode: simulate avatar behavior without API calls
  const initializeAvatarDev = useCallback(async () => {
    if (sessionState !== AvatarSessionState.INACTIVE) return;

    setSessionState(AvatarSessionState.CONNECTING);
    // Simulate connection delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSessionState(AvatarSessionState.CONNECTED);
    console.log("[DEV MODE] Avatar connected (simulated)");
  }, [sessionState]);

  const speakDev = useCallback(
    async (text: string) => {
      if (sessionState !== AvatarSessionState.CONNECTED) return;

      console.log("[DEV MODE] Avatar speaking:", text);
      setIsAvatarTalking(true);
      // Simulate speaking duration based on text length (~100ms per word)
      const duration = Math.max(2000, text.split(" ").length * 100);
      await new Promise((resolve) => setTimeout(resolve, duration));
      setIsAvatarTalking(false);
      console.log("[DEV MODE] Avatar finished speaking");
    },
    [sessionState]
  );

  const stopSessionDev = useCallback(async () => {
    setSessionState(AvatarSessionState.INACTIVE);
    setIsAvatarTalking(false);
    console.log("[DEV MODE] Avatar session stopped");
  }, []);

  const fetchAccessToken = async (): Promise<string> => {
    const response = await fetch("/api/heygen-token", {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch access token");
    }

    return response.text();
  };

  const initializeAvatar = useCallback(async () => {
    if (sessionState !== AvatarSessionState.INACTIVE) {
      console.log("Avatar session already active or connecting");
      return;
    }

    try {
      setError(null);
      setSessionState(AvatarSessionState.CONNECTING);

      const token = await fetchAccessToken();
      const basePath =
        process.env.NEXT_PUBLIC_HEYGEN_BASE_URL || "https://api.heygen.com";

      avatarRef.current = new StreamingAvatar({
        token,
        basePath,
      });

      // Set up event listeners
      avatarRef.current.on(
        StreamingEvents.STREAM_READY,
        ({ detail }: { detail: MediaStream }) => {
          console.log("HeyGen stream ready");
          setStream(detail);
          setSessionState(AvatarSessionState.CONNECTED);
        }
      );

      avatarRef.current.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        console.log("HeyGen stream disconnected");
        setStream(null);
        setSessionState(AvatarSessionState.INACTIVE);
      });

      avatarRef.current.on(StreamingEvents.AVATAR_START_TALKING, () => {
        console.log("Avatar started talking");
        setIsAvatarTalking(true);
      });

      avatarRef.current.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
        console.log("Avatar stopped talking");
        setIsAvatarTalking(false);
      });

      // Start the avatar session
      await avatarRef.current.createStartAvatar({
        ...DEFAULT_AVATAR_CONFIG,
        avatarName: avatarName,
      });
    } catch (err) {
      console.error("Error initializing avatar:", err);
      setError(
        err instanceof Error ? err.message : "Failed to initialize avatar"
      );
      setSessionState(AvatarSessionState.INACTIVE);
    }
  }, [sessionState, avatarName]);

  const speak = useCallback(
    async (text: string) => {
      if (!avatarRef.current || sessionState !== AvatarSessionState.CONNECTED) {
        console.warn("Avatar not connected, cannot speak");
        return;
      }

      try {
        // Use REPEAT to speak the exact text provided (not conversational response)
        await avatarRef.current.speak({
          text,
          taskType: TaskType.REPEAT,
          taskMode: TaskMode.SYNC,
        });
      } catch (err) {
        console.error("Error making avatar speak:", err);
      }
    },
    [sessionState]
  );

  const stopSession = useCallback(async () => {
    if (avatarRef.current) {
      try {
        await avatarRef.current.stopAvatar();
      } catch (err) {
        console.error("Error stopping avatar:", err);
      }
      avatarRef.current = null;
    }
    setStream(null);
    setSessionState(AvatarSessionState.INACTIVE);
    setIsAvatarTalking(false);
  }, []);

  return (
    <HeyGenContext.Provider
      value={{
        sessionState,
        stream,
        isAvatarTalking,
        error,
        initializeAvatar: devMode ? initializeAvatarDev : initializeAvatar,
        speak: devMode ? speakDev : speak,
        stopSession: devMode ? stopSessionDev : stopSession,
      }}
    >
      {children}
    </HeyGenContext.Provider>
  );
};

export const useHeyGen = () => {
  return useContext(HeyGenContext);
};
