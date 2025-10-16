export type ParsedChatMessage = {
  id: number;
  type: 'human' | 'ai';
  content: string;
  createdAt: string;
};

export const parseChat = (chatJson: string | null): ParsedChatMessage[] => {
  if (!chatJson) return [];

  try {
    const items = JSON.parse(chatJson);
    
    return items
      .sort((a: any, b: any) => a.id - b.id)
      .map((it: any) => {
        const msg = JSON.parse(it.message);
        return {
          id: it.id,
          type: msg.type,
          content: msg.content,
          createdAt: it.create_at
        };
      });
  } catch (error) {
    console.error('Error parsing chat:', error);
    return [];
  }
};
