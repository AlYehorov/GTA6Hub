export function StudioGuideTab() {
  return (
    <div className="space-y-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8">
      <section>
        <h2 className="font-heading text-xl font-semibold text-white">Ежедневный флоу</h2>
        <div className="mt-4 rounded-xl border border-gta-pink/20 bg-gta-pink/5 px-4 py-4 font-mono text-sm text-white/80">
          Sources → Editor → Generate → Drafts → Approve → Publish
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-medium text-white">1. Sources — откуда берутся темы</h3>
        <p className="text-sm leading-relaxed text-white/60">
          Editor не придумывает темы сам. Он группирует свежие сигналы из Rockstar Newswire,
          YouTube и Reddit. Без ingestion карточек в Editor не будет.
        </p>
        <ul className="list-inside list-disc space-y-1 text-sm text-white/55">
          <li>Вкладка <strong className="text-white/80">Sources</strong> → кнопка Run full ingestion</li>
          <li>Editor смотрит на последние 7 дней — если давно не ingested, тем мало</li>
          <li>Cron на prod тоже тянет sources раз в день автоматически</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h3 className="font-medium text-white">2. Editor — генерация</h3>
        <ul className="list-inside list-disc space-y-1 text-sm text-white/55">
          <li>Выбери opportunity с высоким score</li>
          <li>Проверь Editorial Focus: headline, primary story, тип статьи</li>
          <li>Если focus invalid — заполни Primary story вручную</li>
          <li>Generate Article → создаётся черновик (нужен OpenAI с балансом)</li>
          <li>Recreate — перегенерировать; Ignore — скрыть тему</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h3 className="font-medium text-white">3. Drafts — review и publish</h3>
        <ul className="list-inside list-disc space-y-1 text-sm text-white/55">
          <li>Cron может auto-publish: confidence ок + нет дубликата → сразу на /news</li>
          <li>Official: approve при confidence ≥ 90%; community/media: от 50% (unverified на сайте)</li>
          <li>Publish as News или Publish as Guide</li>
          <li>После publish тема исчезает из Editor</li>
          <li>Живую статью правь в Articles</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h3 className="font-medium text-white">Если Editor пустой</h3>
        <div className="overflow-hidden rounded-xl border border-white/[0.06]">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/40 text-white/40">
              <tr>
                <th className="px-4 py-2">Проблема</th>
                <th className="px-4 py-2">Решение</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-white/65">
              <tr>
                <td className="px-4 py-2">Нет sources</td>
                <td className="px-4 py-2">Sources → Run full ingestion</td>
              </tr>
              <tr>
                <td className="px-4 py-2">Sources старше 7 дней</td>
                <td className="px-4 py-2">Снова ingestion</td>
              </tr>
              <tr>
                <td className="px-4 py-2">Все опубликовано</td>
                <td className="px-4 py-2">Жди новых Rockstar / Reddit постов</td>
              </tr>
              <tr>
                <td className="px-4 py-2">OpenAI 429</td>
                <td className="px-4 py-2">Пополни баланс на platform.openai.com</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="font-medium text-white">Weekly gaps</h3>
        <p className="text-sm text-white/55">
          В Editor внизу — SEO-гайды по персонажам и локациям, где на сайте ещё нет контента.
          Тип статьи обычно guide, не news.
        </p>
      </section>
    </div>
  );
}
