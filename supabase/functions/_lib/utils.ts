export const toUUID = (str: string, lng: number = 32): string => {
	return (str.length === lng) ? str.split('').toSpliced(8,0,'-').toSpliced(13,0,'-').toSpliced(18,0,'-').toSpliced(23,0,'-').join('').toLowerCase() : str;
};

export const fromUUID = (str: string): string => str.replaceAll('-','');

export const parseJson = (data: string, obj?: object | undefined, debug?: boolean): object | undefined => {
	try {
		obj = JSON.parse(data);
	} catch (e) {
		if (debug) console.error(e);
	}
	return obj;
};

export const isNumeric = (n: string): boolean => !isNaN(parseFloat(n)) && isFinite(Number(n));

export const isDate = (d: any): boolean => d instanceof Date && !Number.isNaN(d.getTime());
