import json
from datetime import datetime


def print_report(results: list, output_dir: str = "tests/reports"):
    passed = sum(1 for r in results if r["pass"])
    failed = len(results) - passed
    total = len(results)

    print(f"\n{'='*80}")
    print(f"TEST REPORT — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*80}")
    print(f"TOTAL: {total} | PASSED: {passed} | FAILED: {failed} | SCORE: {passed/total*100:.0f}%")
    print(f"{'='*80}\n")

    categories = {}
    for r in results:
        cat = r["category"]
        if cat not in categories:
            categories[cat] = {"pass": 0, "fail": 0, "latencies": []}
        if r["pass"]:
            categories[cat]["pass"] += 1
        else:
            categories[cat]["fail"] += 1
        categories[cat]["latencies"].append(r["latency"])

    print("CATEGORY BREAKDOWN:")
    print(f"  {'Category':<14} {'Pass':<8} {'Fail':<8} {'Score':<10} {'Avg Latency'}")
    print(f"  {'-'*54}")
    for cat, data in categories.items():
        total_cat = data["pass"] + data["fail"]
        score = f"{data['pass']/total_cat*100:.0f}%"
        avg_lat = f"{sum(data['latencies'])/len(data['latencies']):.1f}s"
        print(f"  {cat.upper():<14} {data['pass']:<8} {data['fail']:<8} {score:<10} {avg_lat}")

    failures = [r for r in results if not r["pass"]]
    if failures:
        print(f"\nFAILED TESTS ({len(failures)}):")
        for f in failures:
            print(f"  [{f['id']:02d}] {f['category'].upper()} — {f['query'][:60]}")
            print(f"       Expected: {f['expected_outcome']} | Actual: {f['actual']}")
            if f["notes"]:
                print(f"       Notes: {f['notes'][:120]}")

    import os
    os.makedirs(output_dir, exist_ok=True)
    report_path = f"{output_dir}/report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(report_path, "w") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "summary": {"total": total, "passed": passed, "failed": failed, "score": f"{passed/total*100:.0f}%"},
            "category_breakdown": {cat: {"pass": d["pass"], "fail": d["fail"]} for cat, d in categories.items()},
            "results": results
        }, f, indent=2)
    print(f"\nReport saved: {report_path}")