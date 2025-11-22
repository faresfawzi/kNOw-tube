import React, { useState, type ReactNode } from 'react'

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
  
  
  // Ratio constant: controls the difference between biggest and smallest panels
  // Higher value = more difference (more sensitive)
  // Lower value (closer to 1) = more equal sizes (less sensitive)
  // Example: 10 means biggest panel can be 10x the smallest
  const SIZE_RATIO = 4
  
  // Minimum width for panels (in vw)
  const minWidth = 2
  
  const calculateWidths = (control: number) => {
    // Peak positions
    const peak1 = 0
    const peak2 = 1/3
    const peak3 = 2/3
    const peak4 = 1
    
    // Distance calculations
    const dist1 = Math.abs(control - peak1)
    const dist2 = Math.abs(control - peak2)
    const dist3 = Math.abs(control - peak3)
    const dist4 = Math.abs(control - peak4)
    
    // Base weights (Cubic ease ensures smoothness at the peaks)
    const baseWeight1 = Math.pow(1 - Math.min(dist1, 1), 3)
    const baseWeight2 = Math.pow(1 - Math.min(dist2, 1), 3)
    const baseWeight3 = Math.pow(1 - Math.min(dist3, 1), 3)
    const baseWeight4 = Math.pow(1 - Math.min(dist4, 1), 3)
    
    const allBaseWeights = [baseWeight1, baseWeight2, baseWeight3, baseWeight4]
    const minBase = Math.min(...allBaseWeights)
    const maxBase = Math.max(...allBaseWeights)
    
    const applyRatio = (baseWeight: number) => {
      if (maxBase === minBase) return 1
      const normalized = (baseWeight - minBase) / (maxBase - minBase)
      
      // FIX 1: Use a linear or convex curve (power >= 1)
      // Using power of 1 is linear. Power of 2 makes the "big" one pop more.
      // Do NOT use 1/SIZE_RATIO.
      const curve = Math.pow(normalized, 2) 
      
      return 1 + (SIZE_RATIO - 1) * curve
    }
    
    const weight1 = applyRatio(baseWeight1)
    const weight2 = applyRatio(baseWeight2)
    const weight3 = applyRatio(baseWeight3)
    const weight4 = applyRatio(baseWeight4)
    
    const totalWeight = weight1 + weight2 + weight3 + weight4
    
    // Proportions
    const prop1 = totalWeight > 0 ? weight1 / totalWeight : 0.25
    const prop2 = totalWeight > 0 ? weight2 / totalWeight : 0.25
    const prop3 = totalWeight > 0 ? weight3 / totalWeight : 0.25
    
    // FIX 2: Reserve space for ALL 4 panels
    const availableSpace = 100 - (minWidth * 4)
    
    const w1 = minWidth + availableSpace * prop1
    const w2 = minWidth + availableSpace * prop2
    const w3 = minWidth + availableSpace * prop3
    
    // Calculate w4 as remainder to ensure exact 100% sum (avoids floating point gaps)
    const w4 = 100 - (w1 + w2 + w3)

    return { w1, w2, w3, w4 }
  }
  
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
      <div style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        margin: 0,
        padding: 0
      }}>
      <div style={{
        flexBasis: `${width1}vw`,
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
        flexBasis: `${width2}vw`,
        flexShrink: 0,
        flexGrow: 0,
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
        flexBasis: `${width3}vw`,
        flexShrink: 0,
        flexGrow: 0,
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
        flexBasis: `${width4}vw`,
        flexShrink: 0,
        flexGrow: 0,
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

