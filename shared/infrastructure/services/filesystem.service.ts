import { Telegram } from 'telegraf';
import { readFile, stat } from 'fs/promises';
import { createHash, randomUUID } from 'crypto';
import { Injectable } from 'moject';
import { createWriteStream } from 'fs';
import { get } from 'https';
import { TMP_PATH } from '../constants';
import * as path from 'path';
import * as extract from 'extract-zip';
import * as rimraf from 'rimraf';

@Injectable()
export class FilesystemService {
  private readonly tg: Telegram;

  constructor() {
    const token = process.env.BOT_TOKEN;

    if (typeof token !== 'string') {
      throw new Error('BOT_TOKEN is not set');
    }

    this.tg = new Telegram(token);
  }

  download(url: string, to?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const filePath =
        to || path.resolve(TMP_PATH, randomUUID().replace(/-/g, ''));

      const file = createWriteStream(filePath);

      get(url, function (response) {
        const stream = response.pipe(file);

        stream.on('finish', function () {
          resolve(filePath);
        });

        stream.on('error', function (e) {
          reject(e);
        });
      });
    });
  }

  async getHashsum(path: string): Promise<string> {
    const file = await readFile(path);

    const hash = createHash('md5');
    hash.update(file);

    return hash.digest('hex');
  }

  async unzip(archivePath: string): Promise<string> {
    const dir = path.resolve(TMP_PATH, randomUUID().replace(/-/g, ''));
    await extract(archivePath, { dir });
    return dir;
  }

  remove(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      rimraf(path, (e) => {
        if (e) {
          return reject(e);
        }

        resolve();
      });
    });
  }

  readFile(path: string): Promise<Buffer> {
    return readFile(path);
  }

  async exists(path: string): Promise<boolean> {
    try {
      await stat(path);
      return true;
    } catch (e: any) {
      if (e.code === 'ENOENT') {
        return false;
      }

      throw e;
    }
  }
}
