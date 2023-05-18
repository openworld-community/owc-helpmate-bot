import { supabaseAdminClient as supabaseClient } from './supabase.ts';

import ENV from './vars.ts';
const { DEBUG, PUBLIC_FILES_BUCKET = 'public' } = ENV;

export const createSignedUrls = async (filePaths, ts = 600, bucket = PUBLIC_FILES_BUCKET) => { // 600 sec = 10 minutes
	try {
		return await supabaseClient.storage.from(bucket)
			.createSignedUrls([].concat(filePaths), ts);
	} catch (err) {
		console.error(err);
	}
};

export const getPublicUrl = async (filePath, bucket = PUBLIC_FILES_BUCKET) => {
	try {
		return await supabaseClient.storage.from(bucket)
			.getPublicUrl(filePath);
	} catch (err) {
		console.error(err);
	}
};

export const getFiles = async (dir, search = '', offset = 0, limit = 100, sortBy = { column: 'updated_at', order: 'desc' }, bucket = PUBLIC_FILES_BUCKET) => {
	try {
		const {	data, error } = await supabaseClient.storage.from(bucket)
			.list(dir, { limit, offset, sortBy, search });
		const files = data.filter((file) => file.name!=='.emptyFolderPlaceholder') //.map((file) => { publicUrl: (await getPublicUrl(`${dir}/${file.name}`)), ...file });
		return { files, error };
	} catch (err) {
		console.error(err);
	}
};

export const uploadFile = async (filePath, fileBuffer, bucket = PUBLIC_FILES_BUCKET) => {
	try {
		return await supabaseClient.storage.from(bucket)
			.upload(filePath, fileBuffer, { cacheControl: '3600',	upsert: false	});
	} catch (err) {
		console.error(err);
	}
};

export const deleteFiles = async (filePaths, bucket = PUBLIC_FILES_BUCKET) => {
	try {
		return await supabaseClient.storage.from(bucket)
			.remove([].concat(filePaths));
	} catch (err) {
		console.error(err);
	}
};
