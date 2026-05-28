import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { prompt, storyId } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Use z-ai-web-dev-sdk to generate image
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const response = await zai.images.generations.create({
      prompt: `Children's book illustration, warm and gentle style, cute characters, colorful, child-friendly: ${prompt}`,
      size: '1024x1024',
    });

    const imageBase64 = response.data[0]?.base64;
    if (!imageBase64) {
      return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
    }

    // Save image to public/stories directory
    const storiesDir = path.join(process.cwd(), 'public', 'stories');
    await mkdir(storiesDir, { recursive: true });

    const filename = `${storyId || 'img'}_${Date.now()}.png`;
    const filepath = path.join(storiesDir, filename);
    const buffer = Buffer.from(imageBase64, 'base64');
    await writeFile(filepath, buffer);

    const imageUrl = `/stories/${filename}`;

    return NextResponse.json({ imageUrl, base64: imageBase64 });
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
  }
}
