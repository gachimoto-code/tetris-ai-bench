# tetris-ai-bench

6つのAIに **まったく同じプロンプト** でテトリスを実装させ、共通の12項目チェックリストで採点したベンチマークの記録です。各実装は単一HTMLファイルで、そのままブラウザで開けば遊べます。

第2回として、プロンプトを **「テトリス作って」の一言だけ** にした自由演技も実施しました（`round2/` フォルダ、後半に記録）。

## 結果

| モデル | スコア（12項目） | ファイル | 備考 |
|---|---|---|---|
| Claude Opus 5.5 | 12/12 | [opus-55-tetris.html](opus-55-tetris.html) | 仕様忠実。NEXTも正確に1個 |
| Inkling 2 Mini（32k条件） | 12/12 | [inkling-tetris-32k.html](inkling-tetris-32k.html) | 12k条件では推論に全トークンを消費し回答0（下記） |
| Gemini Hydrogen | 12/12 | [gemini-hydrogen-tetris.html](gemini-hydrogen-tetris.html) | ホールド規則・スコアとも仕様どおり |
| Cursor Auto | 11/12 | [cursor-auto-tetris.html](cursor-auto-tetris.html) | ホールドが1落下につき2回使えてしまう |
| ChatGPT | 11/12 | [chatgpt-tetris.html](chatgpt-tetris.html) | ライン消去スコアにレベル倍率。RESTARTボタン不発（Enterは正常） |
| Muse | 12/12 | [muse-tetris.html](muse-tetris.html) | 仕様忠実。NEXTも正確に1個 |

全員のコードはブラウザでの実動確認済み（エラーなし）。自動プレイのスクリプトでは全員ライン消去まで到達できなかったため、消去の確認はコードレビューによるものです。

## 第2回（自由演技）

プロンプトは **「テトリス作って」** の一言だけ。仕様も出力形式も指定せず、各モデルの初回出力をそのまま収録し、「言われなくても入れていた機能」を棚卸ししました。全員のコードはブラウザでの実動確認済み（エラーなし）。

| モデル | サイズ | ファイル | 特徴 |
|---|---|---|---|
| Gemini Hydrogen | 72,307 B | [round2/gemini-free.html](round2/gemini-free.html) | 最大作。コンボ判定、Web Audio合成の効果音、パーティクル、SRSキック、DAS/ARR、ロックディレイ。TailwindをCDNから読む外部依存あり |
| Cursor Auto | 27,126 B（3ファイル） | [round2/cursor-free/index.html](round2/cursor-free/index.html) | 単一HTMLではなく3ファイルに分割。タイトルは「STACK」。SRSキックテーブル完全実装＋独自キーリピート |
| Claude Opus 5.5 | 14,405 B | [round2/opus-free.html](round2/opus-free.html) | アーケード筐体デザイン。DAS/ARR（150ms/40ms）、ロックディレイ500ms、フォーカス喪失で自動ポーズ、ベストスコア保存。Google Fonts依存あり |
| ChatGPT | 12,041 B | [round2/chatgpt-free.html](round2/chatgpt-free.html) | ホールドなし、NEXT 1個。シャッフルが sort(()=>Math.random()-.5) の偏り実装 |
| Muse | 8,670 B | [round2/muse-free.html](round2/muse-free.html) | 唯一の白基調。NEXT 3個、ホールド、ゴースト。スコアは固定式（倍率なし）、加速は直線式 |
| Inkling 2 Mini | 4,676 B | [round2/inkling-free.html](round2/inkling-free.html) | 最小構成。NEXT・ホールド・ゴーストなし、速度500ms固定、出現は完全ランダム。スコア式は「行数×100×行数」の独自仕様。生回答（説明文つき）は [round2/inkling-free-raw.txt](round2/inkling-free-raw.txt) |

Inkling の生成条件は第1回再挑戦と同じ（Vulkan 全オフロード、ctx 49152、temp 1.0 / top-p 1.0 / min-p 0、max_tokens 32768）。推論 7,621 トークン＋可視回答 2,316 トークン、510.6 秒、19.52 tok/s でした。

## 第3回（マインスイーパ自由演技）

プロンプトは **「マインスイーパ作って」** の一言だけ。仕様も出力形式も指定せず、各モデルの初回出力をそのまま収録し、「言われなくても入れていた機能」を棚卸ししました。全員のコードはブラウザでの実動確認済み（ゲーム画面のキャプチャで確認、エラーなし）。

| モデル | サイズ | ファイル | 特徴 |
|---|---|---|---|
| Gemini Hydrogen | 62,440 B | [minesweeper/gemini-free.html](minesweeper/gemini-free.html) | 最大作。カスタムサイズ、Tone.js の効果音、自己ベスト保存、ダーク/ライトテーマ切替まで全部入り。外部依存は Tailwind CDN＋Google Fonts＋Tone.js CDN |
| Cursor Auto | 18,962 B（3ファイル） | [minesweeper/cursor-free/index.html](minesweeper/cursor-free/index.html) | 単一HTMLではなく3ファイルに分割。デザイン重視、顔は ◇／★／× の記号。コードなし |
| Claude Opus 5.5 | 16,784 B | [minesweeper/opus-free.html](minesweeper/opus-free.html) | カスタムサイズ、自己ベスト保存、キーボード操作（矢印・F・R）、aria ラベル、長押しは振動つき。初手の前は旗を置けない |
| Muse | 10,431 B | [minesweeper/muse-free.html](minesweeper/muse-free.html) | 定番を全部押さえた堅実型。コード、長押し旗、旗モード、誤旗の ❌ 表示まで一通り |
| ChatGPT | 10,370 B | [minesweeper/chatgpt-free.html](minesweeper/chatgpt-free.html) | コードなし、勝利時の自動旗立てもなし。上級は 24×16/99。進捗％表示が独自要素。旗は地雷数を超えて置けない |
| Inkling 2 Mini | 6,552 B | [minesweeper/inkling-free.html](minesweeper/inkling-free.html) | 最小構成ながら初回安全・連鎖開放・旗・自動旗立て・誤旗表示は自発的に実装。難易度選択・タイマー・コードなし（9×9/10 固定）。生回答（説明文つき）は [minesweeper/inkling-free-raw.txt](minesweeper/inkling-free-raw.txt) |

### 機能棚卸し（マインスイーパ）

| 機能 | Muse | Inkling | Opus | ChatGPT | Cursor | Gemini |
|---|---|---|---|---|---|---|
| 初回安全（周囲8マス含む） | ● | ● | ● | ● | ● | ● |
| 連鎖開放 | ● | ● | ● | ● | ● | ● |
| 旗＋残数カウンタ | ● | ● | ● | ● | ● | ● |
| タイマー | ● | — | ● | ● | ● | ● |
| コード（一括開き） | ● | — | ● | — | — | ● |
| 難易度3段階 | ● | — | ● | ● | ● | ● |
| カスタムサイズ | — | — | ● | — | — | ● |
| タッチ長押し旗 | ● | — | ● | — | ● | ● |
| 旗モード切替 | ● | — | ● | ● | — | ● |
| 自己ベスト保存 | — | — | ● | — | — | ● |
| 効果音 | — | — | — | — | — | ● |
| テーマ切替 | — | — | — | — | — | ● |
| 勝利時の自動旗立て | ● | ● | ● | — | ● | ● |
| 間違った旗の表示 | ● | ● | ● | ● | — | ● |

Inkling の生成条件はテトリス第2回と同じ（Vulkan 全オフロード、ctx 49152、temp 1.0 / top-p 1.0 / min-p 0、max_tokens 32768）。推論 1,363 トークン＋可視回答 2,898 トークン、215.1 秒、19.98 tok/s でした。

## 統一プロンプト（全文）

全モデルにこの文面をそのまま1回だけ渡し、手直しなしの初回出力を採点しました（Inkling の再挑戦のみ出力上限を変更）。

````
あなたはフロントエンドエンジニアです。以下の仕様でテトリスを実装してください。

# 仕様
- 単一のHTMLファイル1つで完結させること（CSSとJavaScriptはファイル内に埋め込む。外部ライブラリや外部ファイルは使わない）
- プレイフィールドは横10マス×縦20マス
- テトリミノは7種類（I, O, T, S, Z, J, L）で、それぞれ異なる色で表示する
- 出現するテトリミノはランダム（偏りがあってもよいが、7種すべて出現すること）
- 操作： ←→で移動、↓でソフトドロップ、↑で回転、スペースでハードドロップ、Cキーでホールド、Pキーで一時停止/再開
- 次に出現するテトリミノ（NEXT）を1つ表示する
- ホールド機能（1ターンに1回まで、落下が終わるまで再ホールド不可）
- ラインが揃ったら消去し、同時に消したライン数に応じてスコアを加算する（1ライン100、2ライン300、3ライン500、4ライン800）
- 10ライン消すごとにレベルが上がり、落下速度が速くなる
- スコア、消去ライン数、レベルを画面に表示する
- ブロックが上まで積み上がったらゲームオーバーを表示し、Enterキーでリスタートできる
- Canvasで描画する

# 出力形式
- 説明文は一切書かず、HTMLコードだけを出力すること
- コードは ```html で始まるコードブロック1つにまとめること
````

## 採点チェックリスト（12項目）

1. 起動エラーがない
2. テトリミノ7種・色分け
3. 移動＋ソフトドロップ
4. 回転（壁際の壁蹴り含む）
5. ハードドロップ
6. ライン消去
7. スコア表どおり（100/300/500/800、倍率なし）
8. レベルアップ＋落下速度の上昇
9. NEXT表示が1個
10. ホールド（1ターンに1回まで）
11. 一時停止/再開
12. ゲームオーバー表示＋Enterでリスタート

## 注記

- **Inkling 2 Mini** は自宅PC（Ryzen AI Max+ 395 / Radeon 8060S）で llama.cpp（Vulkan）によりローカル実行。推奨サンプリング（temperature 1.0 / top-p 1.0 / min-p 0）。統一条件（ctx 16384、max_tokens 12288）では推論に 12,286 トークンを全て使い切り、可視回答 0 トークンで 0 点。上限を 32,768（ctx 49152）に上げた再挑戦では推論 8,117 / 回答 5,379 トークンで完成し 12/12。
- **受け取り経路の教訓**: Cursor Auto / Gemini / ChatGPT のコードは当初チャットへの貼り付けで受け取ったところ、引用符がスマートクォートに変換され構文エラーになりました。ファイルで受け取り直した原文は3件とも無傷で構文チェック合格でした。このリポジトリのファイルはすべて原文です。
- プレイ動画はこのリポジトリには含めていません。
