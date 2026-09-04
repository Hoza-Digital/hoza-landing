export const openEnquiry = () => {
  window.dispatchEvent(new CustomEvent("hoza:open-enquiry"));
};

export const portalTo = (targetId: string) => {
  document.getElementById(targetId)?.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    block: "start",
  });
};
