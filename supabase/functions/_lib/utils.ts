
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
