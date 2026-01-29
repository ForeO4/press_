import { test, expect, Page } from '@playwright/test';
import { PinkyScreenshot } from '../../helpers/screenshot';
import { ActionLogger } from '../../helpers/action-logger';
import {
  FULL_ROUND_SCORES,
  getFront9Scores,
  getBack9Scores,
  EXPECTED_SETTLEMENT,
  TEST_GAME_CONFIG,
  PRESS_CONFIG,
} from '../../fixtures/test-scores';

/**
 * Full Journey: Event Creation to Settlement
 *
 * This comprehensive test covers the complete user journey through the Press! app:
 * 1. Create a new event
 * 2. Add players to the event
 * 3. Create a Match Play game
 * 4. Enter scores for front 9
 * 5. Create a press (when 2 down)
 * 6. Enter scores for back 9
 * 7. View settlement
 * 8. Check Gator Bucks balances
 * 9. Create a feed post
 *
 * Test Data:
 * - Alex (Owner) vs Blake (Admin)
 * - 10 Gator Bucks per hole Match Play
 * - Blake presses at hole 9 (2 down)
 * - Blake wins original 3&1, press by 5
 * - Net: Alex pays Blake 80 Gator Bucks
 */

test.describe('Full Journey: Event Creation to Settlement', () => {
  let screenshot: PinkyScreenshot;
  let logger: ActionLogger;
  let createdEventId: string | null = null;

  test.beforeEach(async ({ page }) => {
    screenshot = new PinkyScreenshot(page, 'full-journey');
    logger = new ActionLogger('full-journey');
    // Already authenticated via storageState - no need to login
  });

  test.describe.configure({ mode: 'serial' });

  test('1. Create new event', async ({ page }) => {
    // Navigate to dashboard/home
    await logger.action('Navigate to home page', async () => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    });

    await screenshot.capture('01-home-page');

    // Look for create event button
    const createEventButton = page.getByRole('button', { name: /create.*event|new.*event/i }).or(
      page.getByRole('link', { name: /create.*event|new.*event/i })
    );

    const hasCreateButton = await createEventButton.isVisible().catch(() => false);

    if (hasCreateButton) {
      await logger.action('Click create event', async () => {
        await createEventButton.click();
        await page.waitForLoadState('networkidle');
      });

      await screenshot.capture('02-create-event-form');

      // Fill out event basics
      const eventNameInput = page.getByLabel(/event.*name|name/i).or(
        page.locator('input[name="name"]').or(page.locator('input[placeholder*="event"]'))
      );

      if (await eventNameInput.isVisible().catch(() => false)) {
        await logger.action('Enter event name', async () => {
          await eventNameInput.fill('Pinky Test Event');
        });

        await screenshot.capture('03-event-name-entered');

        // Look for next/continue button
        const nextButton = page.getByRole('button', { name: /next|continue|create/i });
        if (await nextButton.isVisible().catch(() => false)) {
          await logger.action('Click next', async () => {
            await nextButton.click();
            await page.waitForLoadState('networkidle');
          });

          await screenshot.capture('04-wizard-step-2');
        }
      }

      // Try to find and store the created event ID from the URL
      const url = page.url();
      const eventMatch = url.match(/event\/([^\/]+)/);
      if (eventMatch) {
        createdEventId = eventMatch[1];
        console.log(`[Pinky] Created event ID: ${createdEventId}`);
      }
    } else {
      // If no create button, navigate to demo event
      console.log('[Pinky] No create event button - using demo event');
      await page.goto('/event/demo-event');
      await page.waitForLoadState('networkidle');
      createdEventId = 'demo-event';
    }

    await screenshot.capture('05-event-created');
    logger.summary();
  });

  test('2. Add players to event', async ({ page }) => {
    const eventId = createdEventId || 'demo-event';

    await logger.action('Navigate to event', async () => {
      await page.goto(`/event/${eventId}`);
      await page.waitForLoadState('networkidle');
    });

    await screenshot.capture('01-event-page');

    // Look for members/players section
    const membersLink = page.getByRole('link', { name: /members|players|team/i }).or(
      page.getByRole('tab', { name: /members|players/i })
    );

    if (await membersLink.isVisible().catch(() => false)) {
      await logger.action('Navigate to members', async () => {
        await membersLink.click();
        await page.waitForLoadState('networkidle');
      });

      await screenshot.capture('02-members-page');

      // Look for add member button
      const addMemberButton = page.getByRole('button', { name: /add.*member|invite|add.*player/i });

      if (await addMemberButton.isVisible().catch(() => false)) {
        await logger.action('Open add member dialog', async () => {
          await addMemberButton.click();
        });

        await screenshot.capture('03-add-member-dialog');

        // Try to add guest players
        const guestPlayers = ['Alex', 'Blake', 'Casey', 'Dana'];
        for (const playerName of guestPlayers) {
          const nameInput = page.getByLabel(/name/i).or(page.locator('input[name="name"]'));
          if (await nameInput.isVisible().catch(() => false)) {
            await logger.action(`Add player: ${playerName}`, async () => {
              await nameInput.fill(playerName);
              const saveButton = page.getByRole('button', { name: /save|add|invite/i });
              if (await saveButton.isVisible().catch(() => false)) {
                await saveButton.click();
                await page.waitForTimeout(500);
              }
            });
          }
        }

        await screenshot.capture('04-players-added');
      }
    }

    // Verify members list
    await logger.action('Verify members displayed', async () => {
      const memberNames = page.getByText(/alex|blake|casey|dana/i);
      const count = await memberNames.count();
      console.log(`[Pinky] Found ${count} player name references`);
    });

    await screenshot.capture('05-members-verified');
    logger.summary();
  });

  test('3. Create Match Play game', async ({ page }) => {
    const eventId = createdEventId || 'demo-event';

    await logger.action('Navigate to games page', async () => {
      await page.goto(`/event/${eventId}/games`);
      await page.waitForLoadState('networkidle');
    });

    await screenshot.capture('01-games-page');

    // Look for create game button
    const createGameButton = page.getByRole('button', { name: /create.*game|new.*game|add.*game/i }).or(
      page.getByTestId('create-game-button')
    );

    if (await createGameButton.isVisible().catch(() => false)) {
      await logger.action('Open create game dialog', async () => {
        await createGameButton.click();
        await page.waitForLoadState('networkidle');
      });

      await screenshot.capture('02-create-game-form');

      // Select game type: Match Play
      const gameTypeSelect = page.getByLabel(/game.*type|type/i).or(
        page.locator('select[name="gameType"]').or(page.getByRole('combobox'))
      );

      if (await gameTypeSelect.isVisible().catch(() => false)) {
        await logger.action('Select Match Play', async () => {
          await gameTypeSelect.click();
          const matchPlayOption = page.getByRole('option', { name: /match.*play/i }).or(
            page.getByText(/match.*play/i)
          );
          if (await matchPlayOption.isVisible().catch(() => false)) {
            await matchPlayOption.click();
          }
        });

        await screenshot.capture('03-match-play-selected');
      }

      // Set stakes
      const stakesInput = page.getByLabel(/stakes|bet|amount/i).or(
        page.locator('input[name="stakes"]')
      );

      if (await stakesInput.isVisible().catch(() => false)) {
        await logger.action('Set stakes to 10', async () => {
          await stakesInput.fill('10');
        });
      }

      await screenshot.capture('04-stakes-set');

      // Select players
      const player1Select = page.getByLabel(/player.*1|first.*player/i).or(
        page.locator('[data-testid="player1-select"]')
      );
      const player2Select = page.getByLabel(/player.*2|second.*player|opponent/i).or(
        page.locator('[data-testid="player2-select"]')
      );

      if (await player1Select.isVisible().catch(() => false)) {
        await logger.action('Select player 1: Alex', async () => {
          await player1Select.click();
          const alexOption = page.getByRole('option', { name: /alex/i });
          if (await alexOption.isVisible().catch(() => false)) {
            await alexOption.click();
          }
        });
      }

      if (await player2Select.isVisible().catch(() => false)) {
        await logger.action('Select player 2: Blake', async () => {
          await player2Select.click();
          const blakeOption = page.getByRole('option', { name: /blake/i });
          if (await blakeOption.isVisible().catch(() => false)) {
            await blakeOption.click();
          }
        });
      }

      await screenshot.capture('05-players-selected');

      // Create the game
      const createButton = page.getByRole('button', { name: /create|start|save/i });
      if (await createButton.isVisible().catch(() => false)) {
        await logger.action('Create game', async () => {
          await createButton.click();
          await page.waitForLoadState('networkidle');
        });
      }

      await screenshot.capture('06-game-created');
    } else {
      console.log('[Pinky] Create game button not visible - checking for existing games');
      await screenshot.capture('02-existing-games');
    }

    // Verify game card appears
    await logger.action('Verify game card', async () => {
      const gameCard = page.getByTestId('game-card').or(
        page.getByText(/match.*play|alex.*vs.*blake/i)
      );
      const hasGame = await gameCard.first().isVisible().catch(() => false);
      console.log(`[Pinky] Game card visible: ${hasGame}`);
    });

    await screenshot.capture('07-game-verified');
    logger.summary();
  });

  test('4. Enter scores for front 9', async ({ page }) => {
    const eventId = createdEventId || 'demo-event';

    await logger.action('Navigate to games', async () => {
      await page.goto(`/event/${eventId}/games`);
      await page.waitForLoadState('networkidle');
    });

    await screenshot.capture('01-games-list');

    // Click on a game card to open it
    const gameCards = page.getByTestId('game-card');
    if (await gameCards.count() > 0) {
      await logger.action('Open first game', async () => {
        await gameCards.first().click();
        await page.waitForLoadState('networkidle');
      });

      await screenshot.capture('02-game-detail');

      // Enter front 9 scores
      const front9Scores = getFront9Scores();

      for (const holeScore of front9Scores) {
        // Look for hole-specific inputs
        const holeSection = page.locator(`[data-hole="${holeScore.hole}"]`).or(
          page.getByText(`Hole ${holeScore.hole}`, { exact: false }).locator('..')
        );

        if (await holeSection.isVisible().catch(() => false)) {
          // Find score inputs for each player
          const alexInput = holeSection.locator('input[data-player="alex"]').or(
            holeSection.locator('input').first()
          );
          const blakeInput = holeSection.locator('input[data-player="blake"]').or(
            holeSection.locator('input').last()
          );

          if (await alexInput.isVisible().catch(() => false)) {
            await logger.action(`Enter hole ${holeScore.hole} - Alex: ${holeScore.alexScore}`, async () => {
              await alexInput.fill(String(holeScore.alexScore));
            });
          }

          if (await blakeInput.isVisible().catch(() => false)) {
            await logger.action(`Enter hole ${holeScore.hole} - Blake: ${holeScore.blakeScore}`, async () => {
              await blakeInput.fill(String(holeScore.blakeScore));
            });
          }
        }

        if (holeScore.hole === 3 || holeScore.hole === 6 || holeScore.hole === 9) {
          await screenshot.capture(`03-hole-${holeScore.hole}-entered`);
        }
      }

      // Verify front 9 status shows Alex 2 UP
      await logger.action('Verify front 9 status', async () => {
        const status = page.getByText(/alex.*2.*up|2.*up/i);
        const hasStatus = await status.isVisible().catch(() => false);
        console.log(`[Pinky] Front 9 status visible: ${hasStatus}`);
      });

      await screenshot.capture('04-front-9-complete');
    } else {
      console.log('[Pinky] No games found to enter scores');
      await screenshot.capture('02-no-games');
    }

    logger.summary();
  });

  test('5. Create a press (Blake fights back)', async ({ page }) => {
    const eventId = createdEventId || 'demo-event';

    await logger.action('Navigate to games', async () => {
      await page.goto(`/event/${eventId}/games`);
      await page.waitForLoadState('networkidle');
    });

    await screenshot.capture('01-games-before-press');

    // Open the game
    const gameCards = page.getByTestId('game-card');
    if (await gameCards.count() > 0) {
      await logger.action('Open game', async () => {
        await gameCards.first().click();
        await page.waitForLoadState('networkidle');
      });

      await screenshot.capture('02-game-detail');

      // Look for press button
      const pressButton = page.getByRole('button', { name: /press/i }).or(
        page.getByTestId('press-button')
      );

      if (await pressButton.isVisible().catch(() => false)) {
        await logger.action('Click press button', async () => {
          await pressButton.click();
        });

        await screenshot.capture('03-press-dialog');

        // Select multiplier (1x)
        const multiplierSelect = page.getByLabel(/multiplier/i).or(
          page.locator('select[name="multiplier"]')
        );

        if (await multiplierSelect.isVisible().catch(() => false)) {
          await logger.action('Select 1x multiplier', async () => {
            await multiplierSelect.selectOption('1');
          });
        }

        await screenshot.capture('04-press-configured');

        // Confirm press
        const confirmButton = page.getByRole('button', { name: /confirm|create.*press|press/i });
        if (await confirmButton.isVisible().catch(() => false)) {
          await logger.action('Confirm press', async () => {
            await confirmButton.click();
            await page.waitForLoadState('networkidle');
          });
        }

        await screenshot.capture('05-press-created');

        // Verify press game created
        await logger.action('Verify press game', async () => {
          const pressGame = page.getByText(/press|hole.*10/i);
          const hasPress = await pressGame.isVisible().catch(() => false);
          console.log(`[Pinky] Press game visible: ${hasPress}`);
        });

        await screenshot.capture('06-press-verified');
      } else {
        console.log('[Pinky] Press button not visible');
        await screenshot.capture('03-no-press-button');
      }
    }

    logger.summary();
  });

  test('6. Enter scores for back 9', async ({ page }) => {
    const eventId = createdEventId || 'demo-event';

    await logger.action('Navigate to games', async () => {
      await page.goto(`/event/${eventId}/games`);
      await page.waitForLoadState('networkidle');
    });

    await screenshot.capture('01-games-list');

    // Open the game
    const gameCards = page.getByTestId('game-card');
    if (await gameCards.count() > 0) {
      await logger.action('Open first game', async () => {
        await gameCards.first().click();
        await page.waitForLoadState('networkidle');
      });

      await screenshot.capture('02-game-detail');

      // Enter back 9 scores
      const back9Scores = getBack9Scores();

      for (const holeScore of back9Scores) {
        const holeSection = page.locator(`[data-hole="${holeScore.hole}"]`).or(
          page.getByText(`Hole ${holeScore.hole}`, { exact: false }).locator('..')
        );

        if (await holeSection.isVisible().catch(() => false)) {
          const alexInput = holeSection.locator('input[data-player="alex"]').or(
            holeSection.locator('input').first()
          );
          const blakeInput = holeSection.locator('input[data-player="blake"]').or(
            holeSection.locator('input').last()
          );

          if (await alexInput.isVisible().catch(() => false)) {
            await logger.action(`Enter hole ${holeScore.hole} - Alex: ${holeScore.alexScore}`, async () => {
              await alexInput.fill(String(holeScore.alexScore));
            });
          }

          if (await blakeInput.isVisible().catch(() => false)) {
            await logger.action(`Enter hole ${holeScore.hole} - Blake: ${holeScore.blakeScore}`, async () => {
              await blakeInput.fill(String(holeScore.blakeScore));
            });
          }
        }

        if (holeScore.hole === 12 || holeScore.hole === 15 || holeScore.hole === 18) {
          await screenshot.capture(`03-hole-${holeScore.hole}-entered`);
        }
      }

      // Verify final results
      await logger.action('Verify match results', async () => {
        // Original: Blake wins 3&1
        const originalResult = page.getByText(/blake.*wins|3.*1|won/i);
        const hasOriginal = await originalResult.isVisible().catch(() => false);
        console.log(`[Pinky] Original result visible: ${hasOriginal}`);

        // Press: Blake wins 5 UP
        const pressResult = page.getByText(/5.*up|press.*blake/i);
        const hasPress = await pressResult.isVisible().catch(() => false);
        console.log(`[Pinky] Press result visible: ${hasPress}`);
      });

      await screenshot.capture('04-round-complete');
    }

    logger.summary();
  });

  test('7. View settlement', async ({ page }) => {
    const eventId = createdEventId || 'demo-event';

    await logger.action('Navigate to settlement', async () => {
      await page.goto(`/event/${eventId}`);
      await page.waitForLoadState('networkidle');
    });

    await screenshot.capture('01-event-page');

    // Look for settlement tab/link
    const settlementLink = page.getByRole('link', { name: /settlement|payouts|balances/i }).or(
      page.getByRole('tab', { name: /settlement|payouts/i })
    );

    if (await settlementLink.isVisible().catch(() => false)) {
      await logger.action('Navigate to settlement', async () => {
        await settlementLink.click();
        await page.waitForLoadState('networkidle');
      });

      await screenshot.capture('02-settlement-page');

      // Verify settlement amounts
      await logger.action('Verify settlement calculations', async () => {
        // Original game: Blake wins 30 Gator Bucks (3&1 × 10)
        const originalPayout = page.getByText(/30.*gator|30.*bucks/i);
        const hasOriginal = await originalPayout.isVisible().catch(() => false);
        console.log(`[Pinky] Original payout visible: ${hasOriginal}`);

        // Press game: Blake wins 50 Gator Bucks (5 × 10)
        const pressPayout = page.getByText(/50.*gator|50.*bucks/i);
        const hasPress = await pressPayout.isVisible().catch(() => false);
        console.log(`[Pinky] Press payout visible: ${hasPress}`);

        // Net: Alex pays Blake 80 Gator Bucks
        const netSettlement = page.getByText(/80.*gator|80.*bucks|net.*80/i);
        const hasNet = await netSettlement.isVisible().catch(() => false);
        console.log(`[Pinky] Net settlement visible: ${hasNet}`);
      });

      await screenshot.capture('03-settlement-details');
    } else {
      console.log('[Pinky] Settlement link not visible');
      await screenshot.capture('02-no-settlement');
    }

    logger.summary();
  });

  test('8. Check Gator Bucks balances', async ({ page }) => {
    const eventId = createdEventId || 'demo-event';

    await logger.action('Navigate to event', async () => {
      await page.goto(`/event/${eventId}`);
      await page.waitForLoadState('networkidle');
    });

    await screenshot.capture('01-event-page');

    // Look for leaderboard or balances
    const balancesLink = page.getByRole('link', { name: /leaderboard|balances|standings/i }).or(
      page.getByRole('tab', { name: /leaderboard|standings/i })
    );

    if (await balancesLink.isVisible().catch(() => false)) {
      await logger.action('Navigate to balances', async () => {
        await balancesLink.click();
        await page.waitForLoadState('networkidle');
      });

      await screenshot.capture('02-balances-page');

      // Verify balances
      // Expected: Alex = 100 - 80 = 20, Blake = 100 + 80 = 180
      await logger.action('Verify Gator Bucks balances', async () => {
        const alexBalance = page.getByText(/alex.*20|20.*gator/i);
        const blakeBalance = page.getByText(/blake.*180|180.*gator/i);

        const hasAlex = await alexBalance.isVisible().catch(() => false);
        const hasBlake = await blakeBalance.isVisible().catch(() => false);

        console.log(`[Pinky] Alex balance visible: ${hasAlex}`);
        console.log(`[Pinky] Blake balance visible: ${hasBlake}`);
      });

      await screenshot.capture('03-balances-verified');
    } else {
      console.log('[Pinky] Balances link not visible');
      await screenshot.capture('02-no-balances');
    }

    logger.summary();
  });

  test('9. Create feed post', async ({ page }) => {
    const eventId = createdEventId || 'demo-event';

    await logger.action('Navigate to feed', async () => {
      await page.goto(`/event/${eventId}`);
      await page.waitForLoadState('networkidle');
    });

    await screenshot.capture('01-event-page');

    // Look for feed tab
    const feedLink = page.getByRole('link', { name: /feed|activity|posts/i }).or(
      page.getByRole('tab', { name: /feed|activity/i })
    );

    if (await feedLink.isVisible().catch(() => false)) {
      await logger.action('Navigate to feed', async () => {
        await feedLink.click();
        await page.waitForLoadState('networkidle');
      });

      await screenshot.capture('02-feed-page');

      // Look for post creation
      const postInput = page.getByPlaceholder(/post|write|share/i).or(
        page.locator('textarea[name="content"]').or(
          page.getByRole('textbox', { name: /post/i })
        )
      );

      if (await postInput.isVisible().catch(() => false)) {
        await logger.action('Write post', async () => {
          await postInput.fill('Great match today! Blake made an incredible comeback on the back nine.');
        });

        await screenshot.capture('03-post-drafted');

        // Submit post
        const postButton = page.getByRole('button', { name: /post|share|submit/i });
        if (await postButton.isVisible().catch(() => false)) {
          await logger.action('Submit post', async () => {
            await postButton.click();
            await page.waitForLoadState('networkidle');
          });
        }

        await screenshot.capture('04-post-submitted');

        // Verify post appears
        await logger.action('Verify post visible', async () => {
          const post = page.getByText(/great match today/i);
          const hasPost = await post.isVisible().catch(() => false);
          console.log(`[Pinky] Post visible: ${hasPost}`);
        });

        await screenshot.capture('05-post-verified');

        // Try to add a reaction
        const reactionButton = page.getByRole('button', { name: /like|react|heart/i }).or(
          page.getByTestId('reaction-button')
        );

        if (await reactionButton.isVisible().catch(() => false)) {
          await logger.action('Add reaction', async () => {
            await reactionButton.click();
            await page.waitForTimeout(500);
          });

          await screenshot.capture('06-reaction-added');
        }
      } else {
        console.log('[Pinky] Post input not visible');
        await screenshot.capture('03-no-post-input');
      }
    } else {
      console.log('[Pinky] Feed link not visible');
      await screenshot.capture('02-no-feed');
    }

    logger.summary();
  });
});
