import { NextRequest, NextResponse } from 'next/server';
import { AgentService } from '@/services/ai/agent-service';
import { FamilyContext } from '@/services/ai/types';
import { db } from '@/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, text, imageBase64, mimeType, audioBase64 } = body;

    // Load actual family members and categories from database
    const [family] = await db.query.families.findMany({
      limit: 1,
      with: {
        members: true,
        categories: true,
      },
    });

    const familyContext: FamilyContext = {
      currentDate: new Date().toISOString().split('T')[0],
      members: family?.members?.map((m) => ({ id: m.id, name: m.displayName, role: m.role })) || [
        { id: 'husband-1', name: 'Lucas Mota', role: 'admin' },
        { id: 'wife-1', name: 'Esposa', role: 'member' },
      ],
      categories: family?.categories?.map((c) => ({ id: c.id, name: c.name })) || [
        { id: 'cat-1', name: 'Mercado & Feira' },
        { id: 'cat-2', name: 'Moradia & Contas Fixas' },
      ],
    };

    const agentService = new AgentService();

    if (type === 'text' && text) {
      const draft = await agentService.processTextInput(text, familyContext);
      return NextResponse.json(draft);
    }

    if (type === 'image' && imageBase64) {
      const draft = await agentService.processReceiptImage(
        imageBase64,
        mimeType || 'image/jpeg',
        familyContext
      );
      return NextResponse.json(draft);
    }

    if (type === 'audio' && audioBase64) {
      const draft = await agentService.processAudioNote(
        audioBase64,
        mimeType || 'audio/mp3',
        familyContext
      );
      return NextResponse.json(draft);
    }

    return NextResponse.json({ error: 'Invalid input payload' }, { status: 400 });
  } catch (error: any) {
    console.error('Agent route error:', error);
    return NextResponse.json(
      {
        error: error?.message || 'Failed to process agent request',
        fallback: {
          description: 'Lançamento identificado',
          amount: 100,
          dueDate: new Date().toISOString().split('T')[0],
          isInstallment: false,
          confidence: 0.85,
        },
      },
      { status: 500 }
    );
  }
}
