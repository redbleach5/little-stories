import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const story = await db.story.findUnique({
      where: { id },
      include: {
        pages: {
          orderBy: { pageNumber: 'asc' }
        }
      }
    });

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    return NextResponse.json(story);
  } catch (error) {
    console.error('Error fetching story:', error);
    return NextResponse.json({ error: 'Failed to fetch story' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, category, ageRange, author, coverImage, isFavorite, pages } = body;

    // Delete existing pages and recreate them
    if (pages) {
      await db.storyPage.deleteMany({ where: { storyId: id } });
    }

    const story = await db.story.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(ageRange !== undefined && { ageRange }),
        ...(author !== undefined && { author }),
        ...(coverImage !== undefined && { coverImage }),
        ...(isFavorite !== undefined && { isFavorite }),
        ...(pages && {
          pages: {
            create: pages.map((page: { pageNumber: number; text: string; illustrationUrl?: string; illustrationPrompt?: string; animationType?: string; animationDuration?: number }, index: number) => ({
              pageNumber: page.pageNumber || index + 1,
              text: page.text,
              illustrationUrl: page.illustrationUrl || '',
              illustrationPrompt: page.illustrationPrompt || '',
              animationType: page.animationType || 'fade',
              animationDuration: page.animationDuration || 1.0,
            }))
          }
        }),
      },
      include: { pages: { orderBy: { pageNumber: 'asc' } } }
    });

    return NextResponse.json(story);
  } catch (error) {
    console.error('Error updating story:', error);
    return NextResponse.json({ error: 'Failed to update story' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.storyPage.deleteMany({ where: { storyId: id } });
    await db.story.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting story:', error);
    return NextResponse.json({ error: 'Failed to delete story' }, { status: 500 });
  }
}
