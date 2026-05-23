import { updateProfile } from '@/app/(dashboard)/account/actions';

type AccountProfileFormProps = {
  fullName: string;
  organization: string;
  email: string;
  error?: string;
  saved?: boolean;
};

export function AccountProfileForm({
  fullName,
  organization,
  email,
  error,
  saved,
}: AccountProfileFormProps) {
  return (
    <form action={updateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label className="pg-label" htmlFor="full_name">Full name</label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          autoComplete="name"
          defaultValue={fullName}
          className="pg-input"
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label className="pg-label" htmlFor="organization">Agency / business</label>
        <input
          id="organization"
          name="organization"
          type="text"
          autoComplete="organization"
          defaultValue={organization}
          placeholder="e.g. Bayside Buyer's"
          className="pg-input"
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span className="pg-label">Email</span>
        <div
          className="pg-input"
          style={{
            background: 'var(--pg-bg-2)',
            color: 'var(--pg-text-dim)',
            cursor: 'not-allowed',
          }}
        >
          {email || '—'}
        </div>
      </div>

      {error ? (
        <p style={{ fontSize: 12.5, color: 'var(--pg-red)', margin: 0 }}>{error}</p>
      ) : null}
      {saved ? (
        <p style={{ fontSize: 12.5, color: 'var(--pg-green)', margin: 0 }}>Profile saved.</p>
      ) : null}

      <div>
        <button type="submit" className="pg-btn pg-btn-primary">
          Save changes
        </button>
      </div>
    </form>
  );
}
