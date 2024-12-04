export const debounce = (
	func: ( ...args: Array<any> ) => void,
	delay: number
): { debounced: VoidFunction; cancel: VoidFunction } => {
	let timer: ReturnType<typeof setTimeout>;

	const debounced = ( ...args: Array<any> ) => {
		clearTimeout( timer );
		timer = setTimeout( () => func( ...args ), delay );
	};

	const cancel = () => {
		clearTimeout( timer );
	};

	return {
		debounced,
		cancel
	};
};
