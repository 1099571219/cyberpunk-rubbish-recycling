import { ThreeScene } from '@/assets/ts/threeScene';
import { useEffect, useRef, useState } from 'react'
const init = (threeDom:React.MutableRefObject<null>)=>{
  const threeScene = new ThreeScene({fov:75,near:.1,far:1000},threeDom.current!)

  const animate = ()=>{
    requestAnimationFrame(animate)
    threeScene.animate()
  } 
  animate()
  return threeScene
}

function ThreeComp() {
  const threeDom = useRef(null)
  useEffect(()=>{
    const threeScene = init(threeDom)
    console.log(threeScene);
    
  },[])
 
 

  return <div ref={threeDom} className="w-100% h-100% bg-amber" />
}

export default ThreeComp
