export default function AuthGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-white font-sans">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes flowUp { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }
        @keyframes flowDown { 0% { transform: translateY(-50%); } 100% { transform: translateY(0); } }
        @keyframes breatheLeft { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-1.5vw) scaleX(1.05); } }
        @keyframes breatheRight { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(1.5vw) scaleX(0.95); } }
        .anim-flow-up { animation: flowUp 20s linear infinite; }
        .anim-flow-down { animation: flowDown 25s linear infinite; }
        .anim-breathe-left { animation: breatheLeft 8s ease-in-out infinite; }
        .anim-breathe-right { animation: breatheRight 11s ease-in-out infinite; }
      `}} />

      {/* Solid left bg */}
      <div className="absolute left-0 top-0 z-0 hidden h-full w-[38vw] bg-[#034b3c] md:block" />

      {/* Light wave */}
      <div className="anim-breathe-right absolute top-0 z-10 hidden h-[200vh] w-[26vw] md:block" style={{ left: '35vw' }}>
        <svg className="anim-flow-down pointer-events-none h-full w-full fill-[#8ebaae]" preserveAspectRatio="none" viewBox="0 0 200 2000">
          <path d="M 100,0 C 250,333 -50,666 100,1000 C 250,1333 -50,1666 100,2000 L -100,2000 L -100,0 Z" />
        </svg>
      </div>

      {/* Dark wave */}
      <div className="anim-breathe-left absolute top-0 z-20 hidden h-[200vh] w-[26vw] md:block" style={{ left: '35vw' }}>
        <svg className="anim-flow-up pointer-events-none h-full w-full fill-[#034b3c]" preserveAspectRatio="none" viewBox="0 0 200 2000">
          <path d="M 100,0 C 220,333 -20,666 100,1000 C 220,1333 -20,1666 100,2000 L -100,2000 L -100,0 Z" />
        </svg>
      </div>

      {/* Left branding — static, never remounts */}
      <div className="relative z-30 hidden w-[40vw] flex-col justify-between p-12 text-white md:flex">
        <div className="mt-8">
          <div className="mb-8">
            <img src="/examizLogo.png" alt="Examiz" className="h-12 brightness-0 invert" />
          </div>
          <h1 className="mb-4 text-5xl font-black tracking-wider text-white">EXAMIZ</h1>
          <p className="max-w-[85%] text-lg font-medium leading-relaxed text-white/90">
            Empowering institutions with smart, secure, and seamless online examination management.
          </p>
          <img src="/login.png" alt="" className="mt-6 w-[85%] rounded-xl object-cover" />
        </div>
        <div className="mb-8 max-w-[90%]">
          <p className="mb-4 text-xs leading-relaxed text-white/70">
            Built for colleges, coaching institutes, and teachers. Create tests, manage students, and analyse results — all in one place.
          </p>
        </div>
      </div>

      {/* Right side — only this swaps on navigation */}
      <div className="relative z-30 flex flex-1 items-center justify-center px-4 py-8 md:pl-[8vw] md:pr-8">
        {children}
      </div>
    </div>
  );
}
