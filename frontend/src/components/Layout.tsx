import React, { useState, useEffect, type ReactNode } from 'react'

interface LayoutProps {
  component1: ReactNode
  component2: ReactNode
  component3: ReactNode
  component4: ReactNode
  sizeControl: number
  setSizeControl: React.Dispatch<React.SetStateAction<number>>
  shouldSizeControlBeVisible?: boolean
}

function Layout({ component1, component2, component3, component4, sizeControl, setSizeControl, shouldSizeControlBeVisible }: LayoutProps) {
  // Single control variable from 0 to 1
  // 0 = first panel maximum, others thin
  // 1 = last panel maximum, others thin
  // In between = middle panels expand/shrink smoothly
    
  const calculateWidths = (control: number) => {
    // Gaussian means
    const mu1 = 0;
    const mu2 = 1 / 3;
    const mu3 = 2 / 3;
    const mu4 = 1;

    // Shared standard deviation
    const sigma = 0.15; // adjust as needed
    const twoSigma2 = 2 * sigma * sigma;

    const gaussian = (x: number, mu: number) =>
      Math.exp(-((x - mu) * (x - mu)) / twoSigma2);

    const g1 = gaussian(control, mu1);
    const g2 = gaussian(control, mu2);
    const g3 = gaussian(control, mu3);
    const g4 = gaussian(control, mu4);

    const total = g1 + g2 + g3 + g4;

    // normalize Gaussian weights to sum to 1
    const p1 = g1 / total;
    const p2 = g2 / total;
    const p3 = g3 / total;
    const p4 = g4 / total;

    // Reserve space for all 4 panels
    const minWidth = 7; // adjust as needed
    const available = 100 - 4 * minWidth;

    const w1 = minWidth + available * p1;
    const w2 = minWidth + available * p2;
    const w3 = minWidth + available * p3;

    // final remainder to enforce exact 100
    const w4 = 100 - (w1 + w2 + w3);

    return { w1, w2, w3, w4 };
  };


  const { w1: width1, w2: width2, w3: width3, w4: width4 } = calculateWidths(sizeControl)

  // Determine which component has the maximum width
  const widths = [width1, width2, width3, width4]
  const maxWidth = Math.max(...widths)
  const active1 = width1 === maxWidth
  const active2 = width2 === maxWidth
  const active3 = width3 === maxWidth
  const active4 = width4 === maxWidth

  // Helper function to clone element and pass active prop
  const cloneWithActive = (element: ReactNode, active: boolean): ReactNode => {
    if (element && typeof element === 'object' && 'type' in element) {
      return React.cloneElement(element as React.ReactElement<any>, { active })
    }
    return element
  }

  useEffect(() => {
    const onScroll = () => {
      const maxScroll =
        document.documentElement.scrollWidth - window.innerWidth;
      const t = maxScroll > 0 ? window.scrollX / maxScroll : 0;
      setSizeControl(t);
    };

    const maxScroll =
        document.documentElement.scrollWidth - window.innerWidth;
    window.scrollTo({
      left: sizeControl * maxScroll,
      top: 0
    });
    console.log('Layout scrollTo called', sizeControl);

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Temporary slider for sizeControl */}
      {shouldSizeControlBeVisible && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '10px 20px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          {/* {width1}<br /> {width2} <br /> {width3} <br /> {width4} */}
          
            <label style={{ fontSize: '14px', fontWeight: 'bold' }}>
              Size Control: {sizeControl.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={sizeControl}
              onChange={(e) => setSizeControl(parseFloat(e.target.value))}
              style={{
                width: '300px',
                cursor: 'pointer'
              }}
            />
        </div>
      )}
      <div className="layout-container" style={{
        height: '100vh',
        width: '400vw',
        margin: 0,
        padding: 0
      }}>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: `${width1}vw`,
        flexShrink: 0,
        flexGrow: 0,
        height: '100%',
        overflow: 'auto',
        borderRight: active1 ? '3px solid rgba(147, 197, 253, 0.6)' : '1px solid #ccc',
        boxShadow: active1 ? '2px 0 8px rgba(0, 0, 0, 0.15), -2px 0 8px rgba(0, 0, 0, 0.15)' : 'none',
        transition: 'border-right 0.3s ease, box-shadow 0.3s ease'
      }}>
        {cloneWithActive(component1, active1)}
      </div>
      <div style={{
        position: 'fixed',
        top: 0,
        left: `${width1}vw`,
        width: `${width2}vw`,
        height: '100%',
        overflow: 'auto',
        borderLeft: active2 ? '3px solid rgba(147, 197, 253, 0.6)' : 'none',
        borderRight: active2 ? '3px solid rgba(147, 197, 253, 0.6)' : '1px solid #ccc',
        boxShadow: active2 ? '2px 0 8px rgba(0, 0, 0, 0.15), -2px 0 8px rgba(0, 0, 0, 0.15)' : 'none',
        transition: 'border-left 0.3s ease, border-right 0.3s ease, box-shadow 0.3s ease'
      }}>
        {cloneWithActive(component2, active2)}
      </div>
      <div style={{
        position: 'fixed',
        top: 0,
        left: `${width1 + width2}vw`,
        width: `${width3}vw`,
        height: '100%',
        overflow: 'auto',
        borderLeft: active3 ? '3px solid rgba(147, 197, 253, 0.6)' : 'none',
        borderRight: active3 ? '3px solid rgba(147, 197, 253, 0.6)' : '1px solid #ccc',
        boxShadow: active3 ? '2px 0 8px rgba(0, 0, 0, 0.15), -2px 0 8px rgba(0, 0, 0, 0.15)' : 'none',
        transition: 'border-left 0.3s ease, border-right 0.3s ease, box-shadow 0.3s ease'
      }}>
        {cloneWithActive(component3, active3)}
      </div>
      <div style={{
        position: 'fixed',
        top: 0,
        left: `${width1 + width2 + width3}vw`,
        width: `${width4}vw`,
        height: '100%',
        overflow: 'auto',
        borderLeft: active4 ? '3px solid rgba(147, 197, 253, 0.6)' : 'none',
        boxShadow: active4 ? '-2px 0 8px rgba(0, 0, 0, 0.15)' : 'none',
        transition: 'border-left 0.3s ease, box-shadow 0.3s ease'
      }}>
        {cloneWithActive(component4, active4)}
      </div>
    </div>
    </>
  )
}

export default Layout

