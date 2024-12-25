export const debounce = (
	func: (...args: Array<any>) => void,
	delay: number | (() => number)
) => {
	let timer: ReturnType<typeof setTimeout>;

	const debounced = (...args: Array<any>) => {
		clearTimeout(timer);
		if (typeof delay === 'function') {
			timer = setTimeout(() => func(...args), delay());
		} else {
			timer = setTimeout(() => func(...args), delay);
		}
	};

	const cancel = () => {
		clearTimeout(timer);
	};

	return {
		debounced,
		cancel,
	};
};
