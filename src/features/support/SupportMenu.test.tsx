import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SUPPORT_LINKS } from '@/config';
import { SupportMenu } from './SupportMenu';

describe('SupportMenu', () => {
  it('offers Wise and PayPal from the config list, each in a new tab without a referrer', async () => {
    const user = userEvent.setup();
    render(<SupportMenu />);
    const button = screen.getByRole('button', { name: 'Gift a beer' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');

    expect(SUPPORT_LINKS.map((l) => l.url)).toEqual([
      'https://wise.com/pay/me/egorr36',
      'https://paypal.me/EgorReviakin',
    ]);
    for (const { label, url } of SUPPORT_LINKS) {
      const link = screen.getByRole('link', { name: new RegExp(`^${label}`) });
      expect(link).toHaveAttribute('href', url);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('closes on Escape (focus back on the button) and on an outside click', async () => {
    const user = userEvent.setup();
    render(
      <>
        <SupportMenu />
        <p>outside</p>
      </>,
    );
    const button = screen.getByRole('button', { name: 'Gift a beer' });
    await user.click(button);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('link', { name: /PayPal/ })).not.toBeInTheDocument();
    expect(button).toHaveFocus();

    await user.click(button);
    await user.click(screen.getByText('outside'));
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('is keyboard operable: Enter opens, Tab reaches the options', async () => {
    const user = userEvent.setup();
    render(<SupportMenu />);
    await user.tab();
    await user.keyboard('{Enter}');
    await user.tab();
    expect(screen.getByRole('link', { name: /^Wise/ })).toHaveFocus();
  });

  it('adding an option is one config line', async () => {
    const user = userEvent.setup();
    render(
      <SupportMenu
        links={[...SUPPORT_LINKS, { id: 'kofi', label: 'Ko-fi', url: 'https://ko-fi.com/x' }]}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Gift a beer' }));
    expect(screen.getAllByRole('link')).toHaveLength(3);
  });

  it('shows a drawn tankard, not an emoji, and labels the button itself', () => {
    render(<SupportMenu />);
    const button = screen.getByRole('button', { name: 'Gift a beer' });
    expect(button.textContent).not.toMatch(/\p{Extended_Pictographic}/u);
    const icon = button.querySelector('svg')!;
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).toHaveAttribute('stroke', 'currentColor');
  });
});
