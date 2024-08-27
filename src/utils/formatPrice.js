export function formatPrice(price) {
	const formatter = Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "GHS",
	}).format(price);
	return formatter;
}
