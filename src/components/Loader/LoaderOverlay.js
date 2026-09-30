"use client";

export default function LoaderOverlay() {
    return (
        <div className="loader-overlay">
            <div className="loader-deer">
                <div className="loader-fill" />
            </div>

            <style scoped>{`
            
            .loader-overlay {
  position: fixed;
  inset: 0;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.loader-deer {
  width: 150px;
  height: 250px;
  background: #0f1624;
  mask-image: url('/Images/Home/head.png');
  -webkit-mask-image: url('/Images/Home/head.png');
  mask-repeat: no-repeat;
  -webkit-mask-repeat: no-repeat;
  mask-size: contain;
  -webkit-mask-size: contain;
  mask-position: center;
  -webkit-mask-position: center;
  position: relative;
  overflow: hidden;
}
.loader-fill {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 0%;
  background: #d3b048;
  animation: loaderFillUp 2.5s ease-out forwards;
}

@keyframes loaderFillUp {
  to { height: 100%; }
}
@media (prefers-reduced-motion: reduce) {
  .loader-fill { animation-duration: 3ms; }
}`}</style>
        </div>
    );
}
