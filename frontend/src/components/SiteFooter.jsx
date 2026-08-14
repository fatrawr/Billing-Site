import { InfiniteSlider } from "./core/infinite-slider.jsx";

const FULL_NAME = "The Co-operative Engineers Town Society Ltd.";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__slider">
        <InfiniteSlider gap={48} speed={28}>
          <span className="site-footer__slide-text">{FULL_NAME}</span>
        </InfiniteSlider>
      </div>

      <div className="site-footer__content">
        <span className="site-footer__brand">CETS</span>
        <span className="site-footer__tag">{FULL_NAME} · Lahore</span>
        <span className="site-footer__copy">© {new Date().getFullYear()} All rights reserved.</span>
      </div>
    </footer>
  );
}
