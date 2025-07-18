"use client"

const NUM_PARTICLES = 15 // Number of particles

const BackgroundParticles = () => {
  const particles = Array.from({ length: NUM_PARTICLES }).map((_, i) => {
    const size = Math.random() * 80 + 20 // Size between 20px and 100px
    const left = Math.random() * 100 // % from left
    const top = Math.random() * 100 // % from top
    const animationDelay = Math.random() * 10 // Delay up to 10s
    const animationDuration = Math.random() * 15 + 10 // Duration between 10s and 25s
    const translateX = (Math.random() - 0.5) * 200 // -100 to 100px
    const translateY = (Math.random() - 0.5) * 200 // -100 to 100px
    const scale = Math.random() * 0.5 + 0.8 // Scale between 0.8 and 1.3

    return (
      <div
        key={i}
        className="particle"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          left: `${left}%`,
          top: `${top}%`,
          animationDelay: `${animationDelay}s`,
          animationDuration: `${animationDuration}s`,
          "--translate-x": `${translateX}px`,
          "--translate-y": `${translateY}px`,
          "--scale": scale,
        }}
      />
    )
  })

  return <div className="particles-container">{particles}</div>
}

export default BackgroundParticles
