import { ThreeScene } from '@/assets/ts/threeScene';
import { useEffect, useRef, useState } from 'react'


function ThreeComp() {
  const threeDom = useRef(null)
  useEffect(()=>{
    const threeScene = new ThreeScene({fov:75,near:.1,far:1000},threeDom.current!)
    console.log(threeScene);
    const animate = ()=>{
      requestAnimationFrame(animate)
      threeScene?.animate()
    } 
    animate()
  },[threeDom])
 
  return <div ref={threeDom} className="w-100% h-100% bg-amber" />
}

export default ThreeComp
