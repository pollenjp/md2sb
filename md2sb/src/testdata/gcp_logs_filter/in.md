このログ形式から大事なポイント:

1. **`component` は labels ではなく `jsonPayload.container.metadata.component`** にいる (gcplogs docker driver は container label を metadata 経由で渡している)。前のターンで案内した `labels."component"=...` は間違いだった。
2. **アプリ側の slog JSON は丸ごと `jsonPayload.message` の文字列に入れ子になっている**。なので `jsonPayload.severity` や `jsonPayload.agent_count` で構造化フィルタはできず、`jsonPayload.message:"..."` のサブストリング/正規表現マッチを使う。
3. `logName` は `projects/<proj>/logs/gcplogs-docker-driver` 固定。

## コピペで使えるフィルタ

### 基本: container-manager の全ログ

```
resource.type="gce_instance"
jsonPayload.container.metadata.component="container-manager"
```



### self-reaper 関連だけ

```
resource.type="gce_instance"
jsonPayload.container.metadata.component="container-manager"
jsonPayload.message:"self-reaper"
```



### tick ハートビートだけ (60s 間隔のはず)

```
resource.type="gce_instance"
jsonPayload.container.metadata.component="container-manager"
jsonPayload.message:"self-reaper: tick"
```



### 起動ログのみ (VM 起動直後の sanity check)

```
resource.type="gce_instance"
jsonPayload.container.metadata.component="container-manager"
jsonPayload.message:"self-reaper: started"
```



### 「いまカウントゼロで reap 待機中」だけ抽出 (agent_count:0 を含む tick)

```
resource.type="gce_instance"
jsonPayload.container.metadata.component="container-manager"
jsonPayload.message=~"self-reaper: tick.*agent_count\\\\\"\\:0"
```


※ ネストした JSON 文字列の中をマッチするので `"` がエスケープされる。`=~` (正規表現) を使う。

### self-delete が走った瞬間

```
resource.type="gce_instance"
jsonPayload.container.metadata.component="container-manager"
jsonPayload.message=~"(timeout reached, deleting self|delete dispatched)"
```



### container-manager の WARN/ERROR だけ (severity が message 文字列内なので regex)

```
resource.type="gce_instance"
jsonPayload.container.metadata.component="container-manager"
jsonPayload.message=~"\"level\":\"(WARN|ERROR)\""
```



### 特定 VM (`cc-tunnel-bd6f3285`) の self-reaper を追う

```
resource.type="gce_instance"
jsonPayload.instance.name="cc-tunnel-bd6f3285"
jsonPayload.container.metadata.component="container-manager"
jsonPayload.message:"self-reaper"
```


---

**運用ヒント**: 今の構造だと中身の severity/agent_count を効くインデックスで検索できないのでクエリが重い。今後本気で運用するなら Log Router で `jsonPayload.message` を再パースして flat に展開するか、Ops Agent + fluent-bit で multi-line/JSON parser を入れる方が筋が良い (Step C のスコープ外なので別途検討)。
