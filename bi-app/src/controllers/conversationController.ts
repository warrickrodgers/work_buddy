import { Request, Response } from 'express';
import { PrismaClient, MessageRole } from '@prisma/client';
import { agentClient } from '../services/agentClient';
import { persistOutline } from '../services/outlineService';


const prisma = new PrismaClient();

// Get all conversations for a user
export const getConversationsByUserId = async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.user_id);
        
        // Add validation
        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const conversations = await prisma.conversation.findMany({
            where: { 
                user_id: userId,  // ← This was missing!
                is_archived: false 
            },
            include: {
                messages: {
                    orderBy: { created_at: 'asc' },
                    take: 1 // Preview message
                },
                _count: {
                    select: { messages: true }
                }
            },
            orderBy: { updated_at: 'desc' }
        });
        
        res.json(conversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
};

// Get single conversation
export const getConversationById = async (req: Request, res: Response) => {
    try {
        const conversationId = parseInt(req.params.id);
        
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                messages: {
                    orderBy: { created_at: 'asc' }
                }
            }
        });
        
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }
        
        res.json(conversation);
    } catch (error) {
        console.error('Error fetching conversation:', error);
        res.status(500).json({ error: 'Failed to fetch conversation' });
    }
};

// Create new conversation
export const createConversation = async (req: Request, res: Response) => {
    try {
        const { user_id, title, conversation_type, challenge_id } = req.body;
        
        const conversation = await prisma.conversation.create({
            data: {
                user_id,
                title: title || 'New Conversation',
                conversation_type: conversation_type || 'GENERAL',
                challenge_id: challenge_id || null
            }
        });
        
        res.status(201).json(conversation);
    } catch (error) {
        console.error('Error creating conversation:', error);
        res.status(500).json({ error: 'Failed to create conversation' });
    }
};

// Update conversation title
export const updateConversationTitle = async (req: Request, res: Response) => {
    try {
        const conversationId = parseInt(req.params.id);
        const { title } = req.body;
        
        const conversation = await prisma.conversation.update({
            where: { id: conversationId },
            data: { title }
        });
        
        res.json(conversation);
    } catch (error) {
        console.error('Error updating conversation title:', error);
        res.status(500).json({ error: 'Failed to update conversation title' });
    }
};

// Get messages with pagination
export const getMessagesByConversationId = async (req: Request, res: Response) => {
    try {
        const conversationId = parseInt(req.params.id);
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 100;
        const skip = (page - 1) * limit;
        
        // Get total count
        const totalMessages = await prisma.chatMessage.count({
            where: { conversation_id: conversationId }
        });
        
        // Get paginated messages
        const messages = await prisma.chatMessage.findMany({
            where: { conversation_id: conversationId },
            orderBy: { created_at: 'asc' },
            skip,
            take: limit
        });
        
        res.json({
            messages,
            pagination: {
                page,
                limit,
                totalMessages,
                totalPages: Math.ceil(totalMessages / limit),
                hasMore: skip + messages.length < totalMessages
            }
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
};

export const addMessageToConversation = async (req: Request, res: Response) => {
    try {
        const conversationId = parseInt(req.params.id);
        const { role, content } = req.body;
        
        // Validate role
        if (!['USER', 'ASSISTANT'].includes(role)) {
            return res.status(400).json({ error: 'Invalid message role' });
        }
        
        // Save user message to database
        const userMessage = await prisma.chatMessage.create({
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

        // If it's a user message, get AI response from agent-server
        if (role === 'USER') {
            try {
                // Get conversation with recent history for context
                const conversation = await prisma.conversation.findUnique({
                    where: { id: conversationId },
                    include: {
                        messages: {
                            orderBy: { created_at: 'asc' },
                            take: 10 // Last 10 messages for context
                        }
                    }
                });

                if (!conversation) {
                    return res.status(404).json({ error: 'Conversation not found' });
                }

                console.log(`Calling agent-server for conversation ${conversationId}`);

                const convUser = await prisma.user.findUnique({
                    where: { id: conversation.user_id },
                    select: { organisation_id: true },
                });

                // Call agent-server to generate AI response
                const aiResponse = await agentClient.generateResponse(
                    conversation.user_id,
                    conversationId,
                    content,
                    conversation.messages.map(msg => ({
                        role: msg.role.toLowerCase(),
                        content: msg.content
                    })),
                    convUser?.organisation_id
                );

                // ── Outline path ──────────────────────────────────────
                if (aiResponse.kind === 'outline') {
                    const challengeId = conversation.challenge_id;

                    if (!challengeId) {
                        console.error('Outline generated but conversation has no challenge_id');
                        // Fall through to treat preamble as a regular message
                    } else {
                        const outline = await persistOutline(
                            challengeId,
                            conversation.user_id,
                            aiResponse.outline
                        );

                        // Store the preamble as the visible assistant message
                        const assistantMessage = await prisma.chatMessage.create({
                            data: {
                                conversation_id: conversationId,
                                role: 'ASSISTANT',
                                content: aiResponse.preamble,
                            }
                        });

                        await prisma.conversation.update({
                            where: { id: conversationId },
                            data: { updated_at: new Date() }
                        });

                        return res.status(201).json({
                            userMessage,
                            assistantMessage,
                            kind:      'outline',
                            outlineId: outline.id,
                            preamble:  aiResponse.preamble,
                            outline:   aiResponse.outline, // raw payload — includes phases for frontend
                        });
                    }
                }

                // ── Conversational path ───────────────────────────────
                const responseContent = aiResponse.content ?? aiResponse.response ?? '';
                console.log('Received AI response:', responseContent.substring(0, 100));

                const assistantMessage = await prisma.chatMessage.create({
                    data: {
                        conversation_id: conversationId,
                        role: 'ASSISTANT',
                        content: responseContent,
                    }
                });

                await prisma.conversation.update({
                    where: { id: conversationId },
                    data: { updated_at: new Date() }
                });

                return res.status(201).json({
                    userMessage,
                    assistantMessage,
                });
            } catch (agentError: any) {
                console.error('Agent service error:', agentError);

                const isServiceOverloaded =
                    agentError?.response?.status === 503 ||
                    agentError?.response?.data?.retryable === true;

                if (isServiceOverloaded) {
                    // Roll back the saved user message so the client can retry cleanly
                    try {
                        await prisma.chatMessage.delete({ where: { id: userMessage.id } });
                    } catch {
                        // Best-effort cleanup — swallow if delete fails
                    }
                    return res.status(503).json({
                        error: 'Simon is currently experiencing increased demand. Please try again shortly.',
                        retryable: true
                    });
                }

                // Non-retryable failure: keep the user message, return partial response
                return res.status(201).json({
                    userMessage,
                    error: 'AI response temporarily unavailable'
                });
            }
        }
        
        // If it's an assistant message (manual input), just return it
        res.status(201).json({ message: userMessage });
    } catch (error) {
        console.error('Error adding message:', error);
        res.status(500).json({ error: 'Failed to add message' });
    }
};