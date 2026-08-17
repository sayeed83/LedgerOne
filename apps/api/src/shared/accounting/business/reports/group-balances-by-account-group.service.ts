// Shared "account hierarchy traversal, account type grouping, account
// aggregation" primitive for the Financial Reporting engine — builds the
// Account Group tree from `parentAccountGroupId` and rolls up each group's
// own Accounts' balances plus every descendant group's subtotal, bottom-up.
// No such traversal utility existed before this milestone (Account/Account
// Group carry only flat parent FKs) — built once here, shared by Trial
// Balance's grouping, Balance Sheet's sections, and P&L's sections, rather
// than reimplemented per report.
import { AccountGroup } from "../../domain/entities/account-group.entity";
import { DecimalValue } from "../../domain/value-objects/decimal-value.value-object";
import { AccountBalance, GroupedBalanceNode } from "./reporting-types";

const ZERO = DecimalValue.create("0");

export function groupBalancesByAccountGroup(accountGroups: AccountGroup[], balances: AccountBalance[]): GroupedBalanceNode[] {
  const nodesById = new Map<bigint, GroupedBalanceNode>();
  for (const accountGroup of accountGroups) {
    nodesById.set(accountGroup.id, { accountGroup, children: [], accountBalances: [], subtotal: ZERO });
  }

  const roots: GroupedBalanceNode[] = [];
  for (const accountGroup of accountGroups) {
    const node = nodesById.get(accountGroup.id) as GroupedBalanceNode;
    const parentNode = accountGroup.parentAccountGroupId ? nodesById.get(accountGroup.parentAccountGroupId) : undefined;
    if (parentNode) {
      parentNode.children.push(node);
    } else {
      roots.push(node);
    }
  }

  for (const balance of balances) {
    const node = nodesById.get(balance.account.accountGroupId);
    if (node) {
      node.accountBalances.push(balance);
    }
  }

  for (const root of roots) {
    computeSubtotal(root);
  }
  return roots;
}

function computeSubtotal(node: GroupedBalanceNode): DecimalValue {
  let total = node.accountBalances.reduce((sum, item) => sum.add(item.balance), ZERO);
  for (const child of node.children) {
    total = total.add(computeSubtotal(child));
  }
  node.subtotal = total;
  return total;
}
