/**
 * Access File Link Use Case
 *
 * Access a temporary file link (public download/view).
 */

import { prisma } from '../../infrastructure/database/index.js';

export interface AccessLinkResult {
  url: string;
  filename?: string;
  contentType?: string;
}

export class AccessFileLinkUseCase {
  async execute(token: string): Promise<AccessLinkResult> {
    const link = await prisma.fileLink.findUnique({
      where: { linkToken: token },
      include: {
        file: true,
      },
    });

    if (!link) {
      throw new Error('Link not found');
    }

    if (!link.isActive) {
      throw new Error('Link is inactive');
    }

    if (link.expiresAt < new Date()) {
      throw new Error('Link has expired');
    }

    if (link.maxDownloads !== null && link.downloadCount >= link.maxDownloads) {
      throw new Error('Download limit reached');
    }

    // Increment download count
    await prisma.fileLink.update({
      where: { id: link.id },
      data: {
        downloadCount: {
          increment: 1,
        },
      },
    });

    if (link.parUrl) {
      return {
        url: link.parUrl,
        filename: link.file?.name,
        contentType: link.file?.mimeType,
      };
    }

    throw new Error('No download URL available for this link');
  }
}
