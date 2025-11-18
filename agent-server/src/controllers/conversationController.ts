import { chromaService } from '../services/chromaService';

// Update addMessageToConversation
export const addMessageToConversation = async (req: Request, res: Response) => {
    try {
        const conversationId = parseInt(req.params.id);
        const { role, content } = req.body;
        
        if (!['USER', 'ASSISTANT'].includes(role)) {
            return res.status(400).json({ error: 'Invalid message role' });
        }
        
        const message = await prisma.chatMessage.create({
            data: {
                conversation_id: conversationId,
                role: role as MessageRole,
                content
            }
        });
        
        // Update conversation timestamp
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { updated_at: new Date() }
        });

        // Store in ChromaDB for semantic search
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId }
        });

        if (conversation) {
            await chromaService.storeMessage(
                message.id.toString(),
                conversation.user_id,
                conversationId,
                role.toLowerCase() as 'user' | 'assistant',
                content
            );
        }
        
        res.status(201).json(message);
    } catch (error) {
        console.error('Error adding message:', error);
        res.status(500).json({ error: 'Failed to add message' });
    }
};