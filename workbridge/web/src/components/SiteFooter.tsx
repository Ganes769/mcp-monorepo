type Props = {
  onConnectOrg: () => void;
  onOpenApp: () => void;
  onBookDemo: () => void;
};

export function SiteFooter({ onConnectOrg, onOpenApp, onBookDemo }: Props) {
  return (
    <footer className="mt-16 w-full bg-[#06122e] px-5 pt-16 sm:px-8">
      <div className="mx-auto max-w-[1120px]">
        <div className="flex flex-col justify-between gap-10 border-b border-white/10 pb-12 lg:flex-row">
          <div className="max-w-sm">
            <h3 className="font-display mb-3 text-2xl font-semibold tracking-tight text-white">
              WorkBridge
            </h3>
            <p className="leading-7 text-slate-300">
              Operations software for teams that already live in Jira and Slack.
            </p>
          </div>
          <div className="flex gap-16">
            <div>
              <h4 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Product
              </h4>
              <button
                type="button"
                onClick={onOpenApp}
                className="block cursor-pointer pb-2 text-left text-slate-200 hover:text-white"
              >
                Standup
              </button>
              <button
                type="button"
                onClick={onConnectOrg}
                className="block cursor-pointer pb-2 text-left text-slate-200 hover:text-white"
              >
                Connect your org
              </button>
              <button
                type="button"
                onClick={onBookDemo}
                className="block cursor-pointer pb-2 text-left text-slate-200 hover:text-white"
              >
                Book a demo
              </button>
            </div>
            <div>
              <h4 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Company
              </h4>
              <p className="pb-2 text-slate-200">About</p>
              <p className="pb-2 text-slate-200">Security</p>
              <p className="pb-2 text-slate-200">Contact</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-3 py-6 text-[13px] text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} WorkBridge</p>
          <p>Terms · Privacy</p>
        </div>
      </div>
    </footer>
  );
}
