# チェキロク リンクルーター

`chekiroku.com` への流入元をプライバシーに配慮して計測し、端末に応じた配布先へ転送するCloudflare Pagesプロジェクトです。

## 公開URL

| URL | 流入元 | 用途 |
|---|---|---|
| `https://chekiroku.com/` | ― | アプリのホームページ |
| `https://chekiroku.com/app` | `app` | 汎用リンク |
| `https://chekiroku.com/qr` | `qr` | QRコード共通リンク |
| `https://chekiroku.com/sns` | `sns` | SNS共通リンク |
| `https://chekiroku.com/qr/<campaign>` | `qr` | イベントなど個別のQRコード |
| `https://chekiroku.com/sns/<campaign>` | `sns` | SNS媒体別リンク |
| `https://chekiroku.com/qr1` | `qr / legacy-qr1` | 既存QRコード互換リンク |

既存の `https://chekiroku-qr.pages.dev/qr1` は `https://chekiroku.com/qr1` へ転送します。

トップページは端末にかかわらずホームページを表示します。`/app`・`/qr`・`/sns` 以下だけが端末に応じてストアまたはダウンロード案内へ分岐し、流入を計測します。

## 転送ルール

- iPhone・iPad・iPod: App Store
- Android: Google Play
- PC・判定不能な端末・SNSプレビューBot: アプリのダウンロード案内ページを表示
- Analytics Engineが利用できない場合も転送を継続

ダウンロード案内ページには、App Store・Google Playへのリンクと、スマートフォンで `https://chekiroku.com/app` を開くQRコードを表示します。SNSプレビュー用のOpen Graphメタデータも同じページで返します。

## 計測データ

Cloudflare Analytics Engineの `chekiroku_link_events` データセットへ、次の順序で保存します。

| 列 | 内容 |
|---|---|
| `index1` | 流入元（`app`、`qr`、`sns`） |
| `blob1` | 流入元 |
| `blob2` | キャンペーン識別子 |
| `blob3` | 端末種別 |
| `blob4` | 転送先 |
| `blob5` | `known_bot` または `unclassified` |
| `blob6` | リファラーのホスト名 |
| `blob7` | 国コード |
| `blob8` | アクセス先ホスト名 |
| `blob9` | アクセス先パス |
| `double1` | 件数（`1`） |

IPアドレス、Cookie、URLに含まれるクエリ、リファラーのパスは保存しません。Analytics Engineのバインディング名は `LINK_ANALYTICS` です。

計測対象ホストは `chekiroku.com` のみです。`*.pages.dev` のプレビューアクセスは記録しません。

Pagesプロジェクトの設定は `wrangler.toml` を正本とし、`LINK_ANALYTICS` を `chekiroku_link_events` データセットへ接続します。

キャンペーン識別子は、先頭がUnicodeの文字または数字で、以降が文字・数字・`.`・`_`・`-` の64文字以内です。既知のBotまたはCloudflareが確認済みのBotだけを `known_bot` とし、それ以外は人間と言い切らず `unclassified` として記録します。クリック数はGETリクエストだけを対象とし、HEADリクエストは記録しません。

## 集計例

直近7日間の流入元・キャンペーン別件数:

```sql
SELECT
  blob1 AS source,
  blob2 AS campaign,
  SUM(_sample_interval) AS visits
FROM chekiroku_link_events
WHERE timestamp >= NOW() - INTERVAL '7' DAY
  AND blob5 != 'known_bot'
  AND blob8 = 'chekiroku.com'
GROUP BY source, campaign
ORDER BY visits DESC
```

## ローカル検証

```sh
npm test
wrangler pages dev .
```
