import type { EventExperience, LevelRange } from '@/domain/types';
import { strings } from '@/strings';
import { Icon } from '@/ui';
import styles from './EventSheet.module.css';

const levels = (r: LevelRange) => strings.eventSheet.levelRange(r.min, r.max);

/** "Experience & rewards" for the viewed version: only the facts the data has, plus its source. */
export function ExperienceSection({ experience }: { experience: EventExperience }) {
  const { xpBonus, levelRange, quests, rewards, notes, source } = experience;
  return (
    <section>
      <h3 className={styles.heading}>{strings.eventSheet.experience}</h3>
      {(xpBonus || levelRange) && (
        <dl className={styles.facts}>
          {xpBonus && (
            <>
              <dt>{strings.eventSheet.xpBonus}</dt>
              <dd>{xpBonus}</dd>
            </>
          )}
          {levelRange && (
            <>
              <dt>{strings.eventSheet.levels}</dt>
              <dd>{levels(levelRange)}</dd>
            </>
          )}
        </dl>
      )}

      {quests && (
        <ul className={styles.quests} aria-label={strings.eventSheet.quests}>
          {quests.map((q) => (
            <li key={q.name} className={styles.quest}>
              <p className={styles.questName}>
                {q.name}
                {q.level && <span className={styles.questLevel}> ({levels(q.level)})</span>}
              </p>
              {q.notes && <p className={styles.note}>{q.notes}</p>}
              {q.rewards && (
                <>
                  <p className={styles.rewardsLabel}>{strings.eventSheet.rewards}</p>
                  <ul className={styles.highlights}>
                    {q.rewards.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {rewards && (
        <>
          <p className={styles.rewardsLabel}>{strings.eventSheet.rewards}</p>
          <ul className={styles.highlights}>
            {rewards.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </>
      )}

      {notes && <p className={styles.note}>{notes}</p>}

      <a href={source} target="_blank" rel="noopener noreferrer" className={styles.link}>
        {strings.eventSheet.experienceSource}
        <Icon name="external" size={16} />
        <span className={styles.srOnly}>{strings.eventSheet.opensInNewTab}</span>
      </a>
    </section>
  );
}
