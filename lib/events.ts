export const openEnquiry = () => {
  window.dispatchEvent(new CustomEvent("hoza:open-enquiry"));
};

export const portalTo = (targetId: string) => {
  window.dispatchEvent(new CustomEvent("hoza:portal", { detail: { targetId } }));
};
