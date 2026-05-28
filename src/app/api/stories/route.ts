import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const stories = await db.story.findMany({
      include: {
        pages: {
          orderBy: { pageNumber: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(stories);
  } catch (error) {
    console.error('Error fetching stories:', error);
    return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, category, ageRange, author, coverImage, pages } = body;

    const story = await db.story.create({
      data: {
        title,
        description: description || '',
        category: category || 'Сказки',
        ageRange: ageRange || '3-6',
        author: author || 'Народная',
        coverImage: coverImage || '',
        pages: pages ? {
          create: pages.map((page: { pageNumber: number; text: string; illustrationUrl?: string; illustrationPrompt?: string; animationType?: string; animationDuration?: number }, index: number) => ({
            pageNumber: page.pageNumber || index + 1,
            text: page.text,
            illustrationUrl: page.illustrationUrl || '',
            illustrationPrompt: page.illustrationPrompt || '',
            animationType: page.animationType || 'fade',
            animationDuration: page.animationDuration || 1.0,
          }))
        } : undefined,
      },
      include: { pages: true }
    });

    return NextResponse.json(story, { status: 201 });
  } catch (error) {
    console.error('Error creating story:', error);
    return NextResponse.json({ error: 'Failed to create story' }, { status: 500 });
  }
}
