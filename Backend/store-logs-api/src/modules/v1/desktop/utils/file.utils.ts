import { join, resolve } from 'path';
import { NotAcceptableException } from '@nestjs/common';
import { promises as fs } from 'fs';
import ffmpeg from 'fluent-ffmpeg';

import { UploadDto } from '../dto/upload.dto';
import { ScreenshotDTO } from '../dto/screenshot.dto';
import { ScreenRecordDTO } from '../dto/screen-record.dto';
import { videoConditions, imageConditions } from '../constants';

export const imageFileFilter = (req, file, callback) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return callback(
            new NotAcceptableException('Only image files are allowed'),
            false,
        );
    }
    if (
        !file.originalname.match(
            /^\d{2}-\d{4}-\d{2}-\d{2} \d{2}-\d{2}-\d{2}-\w{3}\./,
        )
    ) {
        return callback(
            new NotAcceptableException(
                `The file name must match the the DateObject template 'HH-YYYY-MM-DD HH-mm-ss-abc.ext'`,
            ),
            false,
        );
    }

    callback(null, true);
};

export const videoFileFilter = (req, file, callback) => {
    if (!file.originalname.match(/\.(mp4)$/)) {
        return callback(
            new NotAcceptableException('Only .mp4 format video are allowed'),
            false,
        );
    }
    if (
        !file.originalname.match(/^\d{2}-\d{4}-\d{2}-\d{2} \d{2}-\d{2}-\d{2}\./)
    ) {
        return callback(
            new NotAcceptableException(
                `The file name must match the the DateObject template 'HH-YYYY-MM-DD HH-mm-ss.ext'`,
            ),
            false,
        );
    }
    callback(null, true);
};

const videoFileValidate = async (path: string): Promise<void> =>
    new Promise((resolve, reject) => {
        ffmpeg.ffprobe(path, (error, metadata) => {
            if (error) {
                reject(new Error(error.message));
            }

            const { duration, size } = metadata.format;
            if (videoConditions.maxDuration < duration) {
                reject(new Error('Record should be less to 5 minutes'));
            }
            // need testing in feature
            // if (videoConditions.maxSize < size) {
            //   reject(new Error('Record should be less to 15mb'));
            // }

            // const { width, height } = metadata.streams.find(
            //   stream => stream.codec_type === 'video',
            // );

            // if (
            //   videoConditions.maxWidth !== width ||
            //   videoConditions.maxHeigth !== height
            // ) {
            //   reject(new Error('Record should be have resolution 640x480px'));
            // }

            resolve();
        });
    });

const imageFileValidate = async (path: string): Promise<void> =>
    new Promise((resolve, reject) => {
        ffmpeg.ffprobe(path, (error, metadata) => {
            if (error) {
                reject(new Error(error.message));
            }

            const { size } = metadata.format;
            // check size of file
            if (imageConditions.maxSize < size) {
                reject(new Error(`Image should be less than 2MB size.`));
            }
            resolve();
        });
    });

const replaceFormatInName = (name: string, suffix: string = ''): string => {
    const nameParts = name.split('.');
    nameParts.pop();

    return `${nameParts.join('.')}${suffix}.mp4`;
}

const transformVideoFile = async (file: UploadDto): Promise<string> =>
    new Promise((resolve, reject) => {
        ffmpeg.ffprobe(file.filepath, (error, metadata) => {
            if (error) {
                reject(new Error(error.message));
            }

            const trmFilepath: string = replaceFormatInName(file.filepath, '-trm');
            const { maxDuration, maxWidth, maxHeigth, format, codec, bitrate } = videoConditions;
            const { duration } = metadata.format;
            const outputDuration = duration <= maxDuration ? duration : maxDuration;
            ffmpeg(file.filepath)
                .duration(outputDuration)
                .format(format)
                .size(`${maxWidth}x${maxHeigth}`)
                .videoCodec(codec)
                .videoBitrate(bitrate)
                .noAudio()
                .on('end', () => {
                    resolve(trmFilepath);
                })
                .on('error', error => {
                    reject(error);
                })
                .save(trmFilepath);
        });
    });

export const transformVideoFiles = async (files: UploadDto[]): Promise<void> => {
    for (const file of files) {
        const trmFilepath = await transformVideoFile(file);
        await deleteFileFromLocal(file);

        file.filepath = trmFilepath;
        file.originalname = replaceFormatInName(file.originalname);
        file.filename = replaceFormatInName(file.filename);
        file.mimetype = videoConditions.mimetype;
    }
};

export const videoFilesValidate = async (files: UploadDto[]): Promise<void> => {
    for (const file of files) {
        await videoFileValidate(file.filepath);
    }
};
export const imageFilesValidate = async (files: UploadDto[]): Promise<void> => {
    for (const file of files) {
        await imageFileValidate(file.filepath);
    }
};

export const saveFiles = async (
    files: UploadDto[],
    email: string,
    type: string,
    data: ScreenshotDTO | ScreenRecordDTO,
) => {
    // need to create dir on user email id
    // Checking id dir with email id already exists or not
    const folderPath: string = join(resolve(process.env.UPLOAD_PATH), type, email);
    if (!(await checkPathExistence(folderPath))) {
        await fs.mkdir(folderPath, { recursive: true });
    }
    // saving data to local
    const { projectId, taskId } = data;
    for (const file of files) {
        file.filename = `${projectId}-${taskId}-${file.originalname}`;
        file.filepath = join(folderPath, file.filename);
        await fs.writeFile(file.filepath, file.buffer);
        delete file.buffer;
    }
};

export const deleteFilesFromLocal = async (files: UploadDto[]) => {
    for (const file of files) {
        await deleteFileFromLocal(file);
    }
};

export const deleteFileFromLocal = async (file: UploadDto) => {
    await fs.unlink(file.filepath).catch(() => { });
};

export async function checkPathExistence(path: string): Promise<boolean> {
    try {
        await fs.access(path);
        return true;
    } catch (e) {
        return false;
    }
}
