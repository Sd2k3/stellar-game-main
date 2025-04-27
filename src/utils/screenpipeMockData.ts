
// Mock data for Screenpipe components when the real Screenpipe connection fails

export const generateMockScreenpipeItem = (type: string = "OCR", index: number = 0) => {
  const timestamp = new Date(Date.now() - index * 60000).toISOString();
  const id = `mock-${index}-${Date.now()}`;
  
  if (type === "OCR") {
    return {
      id,
      type: "OCR",
      timestamp,
      content: {
        text: `This is sample screen text content #${index}. The Screenpipe app is not connected, so you're seeing demo data.`,
        timestamp,
        app_name: "Demo App",
      }
    };
  }
  
  if (type === "Audio") {
    return {
      id,
      type: "Audio",
      timestamp,
      content: {
        transcription: `This is sample audio transcription #${index}. The Screenpipe app is not connected, so you're seeing demo data.`,
        timestamp,
      }
    };
  }
  
  return {
    id,
    type: "UI",
    timestamp,
    content: {
      element_type: "button",
      text: "Sample UI Element",
      timestamp,
    }
  };
};

export const generateMockScreenpipeItems = (count: number = 5) => {
  const types = ["OCR", "Audio", "UI"];
  return Array.from({ length: count }, (_, i) => 
    generateMockScreenpipeItem(types[i % types.length], i)
  );
};

export const generateMockTranscriptChunk = () => {
  const phrases = [
    "Today we're discussing the project roadmap.",
    "I think we should focus on user feedback first.",
    "The deadline for the first milestone is next Friday.",
    "Let's schedule a follow-up meeting next week.",
    "We need to prioritize fixing those critical bugs.",
    "The client asked for some design changes.",
    "Marketing wants to launch the campaign soon.",
    "User testing revealed some usability issues.",
    "The development team needs more resources.",
    "Overall, I'm happy with our progress so far."
  ];
  
  return {
    choices: [{ text: phrases[Math.floor(Math.random() * phrases.length)] }],
    metadata: {
      timestamp: new Date().toISOString(),
      device: "Mock Microphone",
      isInput: true
    }
  };
};
